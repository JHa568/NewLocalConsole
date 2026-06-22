"""Select the settings module from DJANGO_ENV (defaults to dev).

``DJANGO_SETTINGS_MODULE=config.settings`` resolves to this package, keeping
manage.py / wsgi.py / asgi.py unchanged.
"""

import os

_env = os.environ.get("DJANGO_ENV", "dev").lower()

if _env in ("prod", "production"):
    from .prod import *  # noqa: F401,F403
else:
    from .dev import *  # noqa: F401,F403
