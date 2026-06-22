"""Google Calendar event operations."""

from datetime import date, datetime, timedelta, timezone

from .client import calendar_service


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
    service = calendar_service()
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


def get_current_event(calendar_id="primary"):
    """Return the timed event overlapping 'now', or None.

    Used to tag a Pomodoro session with whatever is on the calendar right now.
    All-day events are ignored — they aren't a "current task".
    """
    now = datetime.now(timezone.utc)
    window_start = (now - timedelta(hours=12)).isoformat()
    window_end = (now + timedelta(hours=12)).isoformat()
    for event in list_events(window_start, window_end, calendar_id):
        start = event.get("start", {}).get("dateTime")
        end = event.get("end", {}).get("dateTime")
        if not start or not end:
            continue
        if datetime.fromisoformat(start) <= now < datetime.fromisoformat(end):
            return event
    return None


def create_event(calendar_id="primary", **kwargs):
    service = calendar_service()
    return service.events().insert(
        calendarId=calendar_id, body=_event_body(**kwargs)
    ).execute()


def update_event(event_id, calendar_id="primary", **kwargs):
    service = calendar_service()
    return service.events().patch(
        calendarId=calendar_id, eventId=event_id, body=_event_body(**kwargs)
    ).execute()


def delete_event(event_id, calendar_id="primary"):
    service = calendar_service()
    service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
