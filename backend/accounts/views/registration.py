import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .. import webauthn_service
from ..models import WebAuthnCredential
from ..serializers import RegisterCompleteSerializer, WebAuthnCredentialSerializer

logger = logging.getLogger(__name__)


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
            logger.warning("WebAuthn registration failed", exc_info=True)
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
