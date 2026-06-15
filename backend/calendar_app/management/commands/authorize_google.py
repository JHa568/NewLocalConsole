"""One-time Google OAuth authorization.

Opens a browser, lets you grant Calendar + Tasks access, and writes the
resulting credentials (including a refresh token) to ``GOOGLE_TOKEN_PATH``.
After this, the backend can call the Google APIs silently.
"""

import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from google_auth_oauthlib.flow import InstalledAppFlow


class Command(BaseCommand):
    help = "Authorize the app against Google Calendar + Tasks (one-time setup)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--port",
            type=int,
            default=0,
            help="Local port for the OAuth redirect server (0 = auto).",
        )

    def handle(self, *args, **options):
        secrets_path = settings.GOOGLE_CLIENT_SECRETS_PATH
        if not os.path.exists(secrets_path):
            raise CommandError(
                f"Client secrets file not found at {secrets_path}. Download OAuth "
                "client credentials from Google Cloud Console first."
            )

        flow = InstalledAppFlow.from_client_secrets_file(
            secrets_path, settings.GOOGLE_SCOPES
        )
        creds = flow.run_local_server(port=options["port"])

        with open(settings.GOOGLE_TOKEN_PATH, "w") as fh:
            fh.write(creds.to_json())

        self.stdout.write(
            self.style.SUCCESS(
                f"Google authorized. Token saved to {settings.GOOGLE_TOKEN_PATH}"
            )
        )
