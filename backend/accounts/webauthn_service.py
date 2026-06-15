"""Thin wrappers around the ``webauthn`` (py_webauthn) library.

All FIDO2 cryptography is handled by py_webauthn; this module only adapts it to
our models and stores the per-ceremony challenge in the Django cache.
"""

import json
import secrets

from django.conf import settings
from django.core.cache import cache

import webauthn
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    AuthenticatorTransport,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

CHALLENGE_TTL_SECONDS = 300  # 5 minutes to complete a ceremony


def _challenge_key(token: str) -> str:
    return f"webauthn:challenge:{token}"


def store_challenge(challenge: bytes) -> str:
    """Persist a challenge in the cache, returning a short opaque token."""
    token = secrets.token_urlsafe(24)
    cache.set(_challenge_key(token), bytes_to_base64url(challenge), CHALLENGE_TTL_SECONDS)
    return token


def pop_challenge(token: str) -> bytes | None:
    key = _challenge_key(token)
    stored = cache.get(key)
    if stored is None:
        return None
    cache.delete(key)
    return base64url_to_bytes(stored)


def _descriptors(credentials):
    descriptors = []
    for cred in credentials:
        transports = [AuthenticatorTransport(t) for t in (cred.transports or [])]
        descriptors.append(
            PublicKeyCredentialDescriptor(
                id=base64url_to_bytes(cred.credential_id),
                transports=transports or None,
            )
        )
    return descriptors


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
def begin_registration(user, existing_credentials):
    options = webauthn.generate_registration_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        rp_name=settings.WEBAUTHN_RP_NAME,
        user_id=str(user.pk).encode("utf-8"),
        user_name=user.get_username(),
        user_display_name=user.get_full_name() or user.get_username(),
        exclude_credentials=_descriptors(existing_credentials),
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.DISCOURAGED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    token = store_challenge(options.challenge)
    return json.loads(webauthn.options_to_json(options)), token


def finish_registration(credential, challenge: bytes):
    """Verify an attestation response. Returns a dict ready for model creation."""
    verification = webauthn.verify_registration_response(
        credential=credential,
        expected_challenge=challenge,
        expected_rp_id=settings.WEBAUTHN_RP_ID,
        expected_origin=settings.WEBAUTHN_ORIGIN,
    )
    transports = []
    if isinstance(credential, dict):
        transports = credential.get("response", {}).get("transports", []) or []
    return {
        "credential_id": bytes_to_base64url(verification.credential_id),
        "public_key": bytes_to_base64url(verification.credential_public_key),
        "sign_count": verification.sign_count,
        "transports": transports,
    }


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
def begin_authentication(credentials):
    options = webauthn.generate_authentication_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        allow_credentials=_descriptors(credentials),
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    token = store_challenge(options.challenge)
    return json.loads(webauthn.options_to_json(options)), token


def finish_authentication(credential_model, credential, challenge: bytes):
    """Verify an assertion. Returns the new sign count on success."""
    verification = webauthn.verify_authentication_response(
        credential=credential,
        expected_challenge=challenge,
        expected_rp_id=settings.WEBAUTHN_RP_ID,
        expected_origin=settings.WEBAUTHN_ORIGIN,
        credential_public_key=base64url_to_bytes(credential_model.public_key),
        credential_current_sign_count=credential_model.sign_count,
    )
    return verification.new_sign_count
