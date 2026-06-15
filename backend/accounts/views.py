import secrets

from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from . import webauthn_service
from .models import WebAuthnCredential
from .serializers import (
    LoginSerializer,
    MfaVerifySerializer,
    RegisterCompleteSerializer,
    UserSerializer,
    WebAuthnCredentialSerializer,
)

User = get_user_model()

MFA_USER_TTL = 300


def _mfa_user_key(token):
    return f"webauthn:mfa-user:{token}"


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class LoginView(APIView):
    """Step 1: verify username + password. If the user has a security key
    registered, return a WebAuthn challenge instead of tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_active:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        credentials = list(user.webauthn_credentials.all())
        if not credentials:
            # No second factor enrolled yet — issue tokens directly so the user
            # can log in and register a YubiKey.
            return Response({"mfa_required": False, "tokens": _issue_tokens(user)})

        options, challenge_token = webauthn_service.begin_authentication(credentials)
        mfa_token = secrets.token_urlsafe(24)
        cache.set(
            _mfa_user_key(mfa_token),
            {"user_id": user.pk, "challenge_token": challenge_token},
            MFA_USER_TTL,
        )
        return Response(
            {
                "mfa_required": True,
                "mfa_token": mfa_token,
                "webauthn_options": options,
            }
        )


class LoginVerifyView(APIView):
    """Step 2: verify the WebAuthn assertion and issue JWTs."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MfaVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mfa_token = serializer.validated_data["mfa_token"]
        credential = serializer.validated_data["credential"]

        session = cache.get(_mfa_user_key(mfa_token))
        if not session:
            return Response(
                {"detail": "MFA session expired. Please log in again."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cache.delete(_mfa_user_key(mfa_token))

        challenge = webauthn_service.pop_challenge(session["challenge_token"])
        if challenge is None:
            return Response(
                {"detail": "Challenge expired. Please log in again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_id = credential.get("id") or credential.get("rawId")
        credential_model = WebAuthnCredential.objects.filter(
            user_id=session["user_id"], credential_id=raw_id
        ).first()
        if credential_model is None:
            return Response(
                {"detail": "Unknown security key."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_sign_count = webauthn_service.finish_authentication(
                credential_model, credential, challenge
            )
        except Exception:
            return Response(
                {"detail": "Security key verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        credential_model.sign_count = new_sign_count
        credential_model.last_used_at = timezone.now()
        credential_model.save(update_fields=["sign_count", "last_used_at"])

        user = User.objects.get(pk=session["user_id"])
        return Response({"tokens": _issue_tokens(user)})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RegisterBeginView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        existing = list(request.user.webauthn_credentials.all())
        options, challenge_token = webauthn_service.begin_registration(
            request.user, existing
        )
        return Response({"webauthn_options": options, "challenge_token": challenge_token})


class RegisterCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegisterCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge_token = request.data.get("challenge_token")
        challenge = webauthn_service.pop_challenge(challenge_token or "")
        if challenge is None:
            return Response(
                {"detail": "Registration challenge expired. Try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = webauthn_service.finish_registration(
                serializer.validated_data["credential"], challenge
            )
        except Exception:
            return Response(
                {"detail": "Could not verify the security key."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        credential = WebAuthnCredential.objects.create(
            user=request.user,
            credential_id=data["credential_id"],
            public_key=data["public_key"],
            sign_count=data["sign_count"],
            transports=data["transports"],
            name=serializer.validated_data.get("name") or "Security key",
        )
        return Response(
            WebAuthnCredentialSerializer(credential).data,
            status=status.HTTP_201_CREATED,
        )


class CredentialListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        creds = request.user.webauthn_credentials.all()
        return Response(WebAuthnCredentialSerializer(creds, many=True).data)


class CredentialDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        deleted, _ = request.user.webauthn_credentials.filter(pk=pk).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
