"""Google API client: credential loading + service builders.

Credentials come from a ``token.json`` produced once by the ``authorize_google``
management command (user OAuth flow). The backend proxies all Google calls so the
React UI never touches Google directly.
"""

import logging
import os

from django.conf import settings

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)


class GoogleNotConnectedError(Exception):
    """Raised when no valid Google credentials are available."""


def load_credentials():
    token_path = settings.GOOGLE_TOKEN_PATH
    if not os.path.exists(token_path):
        raise GoogleNotConnectedError(
            "Google account not connected. Run `python manage.py authorize_google`."
        )
    creds = Credentials.from_authorized_user_file(token_path, settings.GOOGLE_SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            logger.info("Refreshing expired Google credentials")
            creds.refresh(Request())
            with open(token_path, "w") as fh:
                fh.write(creds.to_json())
        else:
            logger.warning("Google credentials present but invalid; re-auth required")
            raise GoogleNotConnectedError("Google credentials are invalid. Re-authorize.")
    return creds


def is_connected() -> bool:
    try:
        load_credentials()
        return True
    except GoogleNotConnectedError:
        return False


def calendar_service():
    return build("calendar", "v3", credentials=load_credentials(), cache_discovery=False)


def tasks_service():
    return build("tasks", "v1", credentials=load_credentials(), cache_discovery=False)
