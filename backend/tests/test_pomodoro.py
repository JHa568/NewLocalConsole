import pytest


@pytest.mark.django_db
def test_current_task_returns_active_event(auth_client, monkeypatch):
    monkeypatch.setattr(
        "pomodoro.views.google_service.get_current_event",
        lambda: {"id": "evt1", "summary": "Deep work"},
    )
    resp = auth_client.get("/api/pomodoro/current-task/")
    assert resp.status_code == 200
    assert resp.data == {"event_id": "evt1", "summary": "Deep work"}


@pytest.mark.django_db
def test_current_task_none_when_no_event(auth_client, monkeypatch):
    monkeypatch.setattr(
        "pomodoro.views.google_service.get_current_event", lambda: None
    )
    resp = auth_client.get("/api/pomodoro/current-task/")
    assert resp.status_code == 200
    assert resp.data == {"event_id": None, "summary": None}


@pytest.mark.django_db
def test_current_task_503_when_not_connected(auth_client, monkeypatch):
    from calendar_app.google_service import GoogleNotConnectedError

    def boom():
        raise GoogleNotConnectedError()

    monkeypatch.setattr(
        "pomodoro.views.google_service.get_current_event", lambda: boom()
    )
    resp = auth_client.get("/api/pomodoro/current-task/")
    assert resp.status_code == 503
    assert resp.data["connected"] is False


@pytest.mark.django_db
def test_create_and_list_session_scoped_to_user(auth_client):
    resp = auth_client.post(
        "/api/pomodoro/sessions/",
        {
            "task_title": "Write report",
            "calendar_event_id": "evt1",
            "duration_minutes": 25,
            "started_at": "2026-06-22T09:00:00Z",
        },
        format="json",
    )
    assert resp.status_code == 201
    assert resp.data["task_title"] == "Write report"

    listed = auth_client.get("/api/pomodoro/sessions/")
    assert listed.status_code == 200
    assert len(listed.data) == 1
    assert listed.data[0]["duration_minutes"] == 25
