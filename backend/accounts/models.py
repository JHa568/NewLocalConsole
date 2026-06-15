import uuid

from django.conf import settings
from django.db import models


class WebAuthnCredential(models.Model):
    """A registered FIDO2 / WebAuthn authenticator (e.g. a YubiKey) for a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="webauthn_credentials",
    )
    # Base64url-encoded credential id returned by the authenticator.
    credential_id = models.TextField(unique=True)
    # Base64url-encoded COSE public key.
    public_key = models.TextField()
    sign_count = models.BigIntegerField(default=0)
    transports = models.JSONField(default=list, blank=True)
    name = models.CharField(max_length=255, default="Security key")
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.user})"
