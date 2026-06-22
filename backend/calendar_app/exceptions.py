"""DRF exception handling for the Google proxy endpoints.

A single handler turns ``GoogleNotConnectedError`` (raised anywhere inside a DRF
view) into the canonical 503 response, so the calendar/task/pomodoro views no
longer need to wrap every Google call in ``try/except``.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .google_service import GoogleNotConnectedError


def google_exception_handler(exc, context):
    """Map ``GoogleNotConnectedError`` to a 503; defer everything else to DRF."""
    if isinstance(exc, GoogleNotConnectedError):
        return Response(
            {"detail": "Google account not connected.", "connected": False},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return drf_exception_handler(exc, context)
