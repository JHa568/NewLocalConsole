"""Google Calendar + Tasks service layer.

Split into ``client`` (auth), ``events`` and ``tasks``. The public names are
re-exported here (and via the thin ``calendar_app.google_service`` facade) so
callers import a single, stable surface.
"""

from .client import (
    GoogleNotConnectedError,
    calendar_service,
    is_connected,
    load_credentials,
    tasks_service,
)
from .events import (
    create_event,
    delete_event,
    get_current_event,
    list_events,
    update_event,
)
from .tasks import (
    create_task,
    delete_task,
    list_tasks,
    update_task,
)

__all__ = [
    "GoogleNotConnectedError",
    "is_connected",
    "load_credentials",
    "calendar_service",
    "tasks_service",
    "list_events",
    "get_current_event",
    "create_event",
    "update_event",
    "delete_event",
    "list_tasks",
    "create_task",
    "update_task",
    "delete_task",
]
