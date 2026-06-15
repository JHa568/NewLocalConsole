import pytest


@pytest.mark.django_db
def test_events_list_proxies_google(auth_client, monkeypatch):
    monkeypatch.setattr(
        "calendar_app.views.google_service.list_events",
        lambda time_min, time_max: [{"id": "evt1", "summary": "Standup"}],
    )
    resp = auth_client.get(
        "/api/calendar/events/?start=2026-06-01T00:00:00Z&end=2026-06-30T23:59:59Z"
    )
    assert resp.status_code == 200
    assert resp.data[0]["summary"] == "Standup"


@pytest.mark.django_db
def test_events_list_requires_range(auth_client):
    assert auth_client.get("/api/calendar/events/").status_code == 400


@pytest.mark.django_db
def test_create_timed_event(auth_client, monkeypatch):
    captured = {}

    def fake_create(**kwargs):
        captured.update(kwargs)
        return {"id": "new-evt", **kwargs}

    monkeypatch.setattr("calendar_app.views.google_service.create_event", fake_create)

    resp = auth_client.post(
        "/api/calendar/events/",
        {
            "summary": "Lunch",
            "all_day": False,
            "start": "2026-06-20T12:00:00",
            "end": "2026-06-20T13:00:00",
        },
        format="json",
    )
    assert resp.status_code == 201
    assert captured["all_day"] is False
    assert captured["summary"] == "Lunch"


@pytest.mark.django_db
def test_create_task(auth_client, monkeypatch):
    monkeypatch.setattr(
        "calendar_app.views.google_service.create_task",
        lambda **kwargs: {"id": "task1", "title": kwargs["title"]},
    )
    resp = auth_client.post(
        "/api/calendar/tasks/",
        {"title": "Pay rent", "due": "2026-06-30"},
        format="json",
    )
    assert resp.status_code == 201
    assert resp.data["title"] == "Pay rent"


@pytest.mark.django_db
def test_not_connected_returns_503(auth_client, monkeypatch):
    from calendar_app.google_service import GoogleNotConnectedError

    def boom():
        raise GoogleNotConnectedError()

    monkeypatch.setattr(
        "calendar_app.views.google_service.list_tasks", lambda: boom()
    )
    resp = auth_client.get("/api/calendar/tasks/")
    assert resp.status_code == 503
    assert resp.data["connected"] is False
