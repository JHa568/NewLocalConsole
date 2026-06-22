"""Google Tasks operations."""

from datetime import datetime

from .client import tasks_service


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
    service = tasks_service()
    result = service.tasks().list(tasklist=tasklist, showCompleted=True).execute()
    return result.get("items", [])


def create_task(tasklist="@default", **kwargs):
    service = tasks_service()
    return service.tasks().insert(tasklist=tasklist, body=_task_body(**kwargs)).execute()


def update_task(task_id, tasklist="@default", **kwargs):
    service = tasks_service()
    return service.tasks().patch(
        tasklist=tasklist, task=task_id, body=_task_body(**kwargs)
    ).execute()


def delete_task(task_id, tasklist="@default"):
    service = tasks_service()
    service.tasks().delete(tasklist=tasklist, task=task_id).execute()
