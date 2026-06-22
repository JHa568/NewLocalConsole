"""Regression tests locking down the maintainability refactor.

These guard behaviour that moved between modules: the global Google exception
handler, serializer-based stock enrichment (now also on ``retrieve``), and the
finance summary payload shape.
"""

import pytest

from finance.models import StockPosition


@pytest.mark.django_db
def test_event_create_503_via_global_handler(auth_client, monkeypatch):
    """A non-task endpoint also returns 503 through the EXCEPTION_HANDLER."""
    from calendar_app.google_service import GoogleNotConnectedError

    def boom(**kwargs):
        raise GoogleNotConnectedError()

    monkeypatch.setattr("calendar_app.views.google_service.create_event", boom)
    resp = auth_client.post(
        "/api/calendar/events/",
        {"summary": "x", "start": "2026-06-20T12:00:00", "end": "2026-06-20T13:00:00"},
        format="json",
    )
    assert resp.status_code == 503
    assert resp.data == {"detail": "Google account not connected.", "connected": False}


@pytest.mark.django_db
def test_stock_retrieve_includes_live_price(auth_client, user, monkeypatch):
    """Enrichment now lives in the serializer, so retrieve is enriched too."""
    position = StockPosition.objects.create(
        user=user, ticker="CBA.AX", quantity=10, avg_cost=100
    )
    monkeypatch.setattr(
        "finance.views.prices.get_quote",
        lambda ticker: {"price": 150.0, "currency": "AUD", "change_pct": 1.2},
    )
    resp = auth_client.get(f"/api/finance/stocks/{position.id}/")
    assert resp.status_code == 200
    assert resp.data["price"] == 150.0
    assert resp.data["market_value"] == 1500.0


@pytest.mark.django_db
def test_summary_payload_shape(auth_client, user, monkeypatch):
    monkeypatch.setattr(
        "finance.views.prices.get_quote",
        lambda ticker: {"price": 100.0, "currency": "AUD", "change_pct": 0.5},
    )
    resp = auth_client.get("/api/finance/summary/")
    assert resp.status_code == 200
    assert set(resp.data.keys()) == {
        "monthly_income",
        "rent_status",
        "portfolio_value",
        "positions",
        "balances_total",
        "net_worth_estimate",
    }
    assert set(resp.data["rent_status"].keys()) == {
        "period",
        "exists",
        "paid",
        "amount",
    }
