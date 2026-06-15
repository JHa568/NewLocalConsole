"""Seed deterministic users for end-to-end tests."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

# (username, password): e2euser exercises the full key-registration + MFA flow;
# featureuser stays password-only so feature tests log in without a key.
USERS = [
    ("e2euser", "e2e-password-123"),
    ("featureuser", "feature-pass-123"),
]


class Command(BaseCommand):
    help = "Create (or reset) the e2e test users."

    def handle(self, *args, **options):
        for username, password in USERS:
            User.objects.filter(username=username).delete()
            User.objects.create_user(username=username, password=password)
            self.stdout.write(self.style.SUCCESS(f"Seeded user '{username}'."))
