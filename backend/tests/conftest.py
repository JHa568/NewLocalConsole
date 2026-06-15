import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="alice", password="s3cret-pass-123")


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client
