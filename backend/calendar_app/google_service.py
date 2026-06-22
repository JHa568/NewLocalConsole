"""Backwards-compatible facade for the Google service layer.

The implementation now lives in ``calendar_app.services`` (``client``/``events``/
``tasks``). This module re-exports the public names so existing imports and the
test monkeypatch targets (``calendar_app.views.google_service.<fn>``) keep
working unchanged.
"""

from .services import (  # noqa: F401
    GoogleNotConnectedError,
    calendar_service,
    create_event,
    create_task,
    delete_event,
    delete_task,
    get_current_event,
    is_connected,
    list_events,
    list_tasks,
    load_credentials,
    tasks_service,
    update_event,
    update_task,
)
