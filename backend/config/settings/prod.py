"""Production settings — refuses to boot with insecure defaults."""

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import DEBUG, INSECURE_SECRET_KEY, SECRET_KEY

if SECRET_KEY == INSECURE_SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY must be set via env in production.")

if DEBUG:
    raise ImproperlyConfigured("DEBUG must be False in production.")
