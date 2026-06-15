"""Google Calendar + Tasks API access.

Credentials come from a ``token.json`` produced once by the ``authorize_google``
management command (user OAuth flow). The backend proxies all Google calls so the
React UI never touches Google directly.
"""

import os
from datetime import date, datetime, timedelta

from django.conf import settings

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


class GoogleNotConnectedError(Exception):
    """Raised when no valid Google credentials are available."""


def _load_credentials():
    token_path = settings.GOOGLE_TOKEN_PATH
    if not os.path.exists(token_path):
        raise GoogleNotConnectedError(
            "Google account not connected. Run `python manage.py authorize_google`."
        )
    creds = Credentials.from_authorized_user_file(token_path, settings.GOOGLE_SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_path, "w") as fh:
                fh.write(creds.to_json())
        else:
            raise GoogleNotConnectedError("Google credentials are invalid. Re-authorize.")
    return creds


def is_connected() -> bool:
    try:
        _load_credentials()
        return True
    except GoogleNotConnectedError:
        return False


def _calendar():
    return build("calendar", "v3", credentials=_load_credentials(), cache_discovery=False)


def _tasks():
    return build("tasks", "v1", credentials=_load_credentials(), cache_discovery=False)


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------
def _event_body(*, summary, description=None, all_day=False, start=None, end=None,
                time_zone="UTC"):
    body = {"summary": summary}
    if description is not None:
        body["description"] = description
    if all_day:
        start_date = date.fromisoformat(start)
        # Google treats end.date as exclusive for all-day events.
        end_date = date.fromisoformat(end) if end else start_date + timedelta(days=1)
        body["start"] = {"date": start_date.isoformat()}
        body["end"] = {"date": end_date.isoformat()}
    else:
        body["start"] = {"dateTime": start, "timeZone": time_zone}
        body["end"] = {"dateTime": end, "timeZone": time_zone}
    return body


def list_events(time_min, time_max, calendar_id="primary"):
    service = _calendar()
    result = (
        service.events()
        .list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return result.get("items", [])


def create_event(calendar_id="primary", **kwargs):
    service = _calendar()
    return service.events().insert(
        calendarId=calendar_id, body=_event_body(**kwargs)
    ).execute()


def update_event(event_id, calendar_id="primary", **kwargs):
    service = _calendar()
    return service.events().patch(
        calendarId=calendar_id, eventId=event_id, body=_event_body(**kwargs)
    ).execute()


def delete_event(event_id, calendar_id="primary"):
    service = _calendar()
    service.events().delete(calendarId=calendar_id, eventId=event_id).execute()


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------
def _task_body(*, title, notes=None, due=None, completed=False):
    body = {"title": title}
    if notes is not None:
        body["notes"] = notes
    if due is not None:
        # Tasks API expects RFC 3339; date-only is fine with a midnight time.
        body["due"] = due if "T" in due else f"{due}T00:00:00.000Z"
    body["status"] = "completed" if completed else "needsAction"
    if completed:
        body["completed"] = datetime.utcnow().isoformat() + "Z"
    return body


def list_tasks(tasklist="@default"):
    service = _tasks()
    result = service.tasks().list(tasklist=tasklist, showCompleted=True).execute()
    return result.get("items", [])


def create_task(tasklist="@default", **kwargs):
    service = _tasks()
    return service.tasks().insert(tasklist=tasklist, body=_task_body(**kwargs)).execute()


def update_task(task_id, tasklist="@default", **kwargs):
    service = _tasks()
    return service.tasks().patch(
        tasklist=tasklist, task=task_id, body=_task_body(**kwargs)
    ).execute()


def delete_task(task_id, tasklist="@default"):
    service = _tasks()
    service.tasks().delete(tasklist=tasklist, task=task_id).execute()
