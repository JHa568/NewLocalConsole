from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import WebAuthnCredential

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    has_security_key = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "has_security_key"]

    def get_has_security_key(self, obj):
        return obj.webauthn_credentials.exists()


class WebAuthnCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebAuthnCredential
        fields = ["id", "name", "transports", "created_at", "last_used_at"]
        read_only_fields = ["id", "transports", "created_at", "last_used_at"]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})


class MfaVerifySerializer(serializers.Serializer):
    mfa_token = serializers.CharField()
    credential = serializers.JSONField()


class RegisterCompleteSerializer(serializers.Serializer):
    credential = serializers.JSONField()
    name = serializers.CharField(required=False, allow_blank=True)
