from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import WebAuthnCredential


@pytest.mark.django_db
def test_login_without_security_key_issues_tokens(api_client, user):
    resp = api_client.post(
        "/api/auth/login/",
        {"username": "alice", "password": "s3cret-pass-123"},
        format="json",
    )
    assert resp.status_code == 200
    assert resp.data["mfa_required"] is False
    assert "access" in resp.data["tokens"]
    assert "refresh" in resp.data["tokens"]


@pytest.mark.django_db
def test_login_with_bad_password_rejected(api_client, user):
    resp = api_client.post(
        "/api/auth/login/",
        {"username": "alice", "password": "wrong"},
        format="json",
    )
    assert resp.status_code == 401


@pytest.mark.django_db
def test_login_with_security_key_requires_mfa(api_client, user):
    WebAuthnCredential.objects.create(
        user=user, credential_id="cred-1", public_key="pk", sign_count=0
    )
    resp = api_client.post(
        "/api/auth/login/",
        {"username": "alice", "password": "s3cret-pass-123"},
        format="json",
    )
    assert resp.status_code == 200
    assert resp.data["mfa_required"] is True
    assert "mfa_token" in resp.data
    assert "webauthn_options" in resp.data


@pytest.mark.django_db
def test_mfa_verify_issues_tokens(api_client, user, monkeypatch):
    cred = WebAuthnCredential.objects.create(
        user=user, credential_id="cred-abc", public_key="pk", sign_count=0
    )

    # Step 1: login to obtain the mfa_token + challenge in cache.
    login = api_client.post(
        "/api/auth/login/",
        {"username": "alice", "password": "s3cret-pass-123"},
        format="json",
    )
    mfa_token = login.data["mfa_token"]

    # Mock the cryptographic verification — we are testing the view glue.
    monkeypatch.setattr(
        "accounts.views.webauthn_service.finish_authentication",
        lambda model, credential, challenge: 5,
    )

    resp = api_client.post(
        "/api/auth/login/verify/",
        {"mfa_token": mfa_token, "credential": {"id": "cred-abc"}},
        format="json",
    )
    assert resp.status_code == 200
    assert "access" in resp.data["tokens"]
    cred.refresh_from_db()
    assert cred.sign_count == 5
    assert cred.last_used_at is not None


@pytest.mark.django_db
def test_mfa_verify_unknown_key_rejected(api_client, user):
    WebAuthnCredential.objects.create(
        user=user, credential_id="cred-known", public_key="pk", sign_count=0
    )
    login = api_client.post(
        "/api/auth/login/",
        {"username": "alice", "password": "s3cret-pass-123"},
        format="json",
    )
    resp = api_client.post(
        "/api/auth/login/verify/",
        {"mfa_token": login.data["mfa_token"], "credential": {"id": "unknown-key"}},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_me_requires_auth(api_client, auth_client):
    assert api_client.get("/api/auth/me/").status_code == 401
    resp = auth_client.get("/api/auth/me/")
    assert resp.status_code == 200
    assert resp.data["username"] == "alice"


@pytest.mark.django_db
def test_refresh_token_expires_after_three_days(user, settings):
    """The 3-day expiry: a refresh token older than REFRESH_TOKEN_LIFETIME is rejected."""
    from rest_framework_simplejwt.exceptions import TokenError

    refresh = RefreshToken.for_user(user)
    # Force the token's expiry into the past (beyond 3 days).
    refresh.set_exp(from_time=timezone.now() - timedelta(days=4))
    expired = str(refresh)

    from rest_framework.test import APIClient

    resp = APIClient().post("/api/auth/refresh/", {"refresh": expired}, format="json")
    assert resp.status_code == 401
