from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="login"),
    path("login/verify/", views.LoginVerifyView.as_view(), name="login-verify"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path(
        "webauthn/register/begin/",
        views.RegisterBeginView.as_view(),
        name="webauthn-register-begin",
    ),
    path(
        "webauthn/register/complete/",
        views.RegisterCompleteView.as_view(),
        name="webauthn-register-complete",
    ),
    path(
        "webauthn/credentials/",
        views.CredentialListView.as_view(),
        name="webauthn-credentials",
    ),
    path(
        "webauthn/credentials/<uuid:pk>/",
        views.CredentialDeleteView.as_view(),
        name="webauthn-credential-delete",
    ),
]
