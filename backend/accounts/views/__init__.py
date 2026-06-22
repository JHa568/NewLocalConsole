"""Account views, split by concern.

Re-exported here so ``accounts.urls`` (and any ``views.X`` reference) keeps a
single import surface.
"""

from .. import webauthn_service  # noqa: F401  (patch seam: accounts.views.webauthn_service)
from .credentials import CredentialDeleteView, CredentialListView
from .login import LoginVerifyView, LoginView, LogoutView, MeView
from .registration import RegisterBeginView, RegisterCompleteView

__all__ = [
    "LoginView",
    "LoginVerifyView",
    "LogoutView",
    "MeView",
    "RegisterBeginView",
    "RegisterCompleteView",
    "CredentialListView",
    "CredentialDeleteView",
]
