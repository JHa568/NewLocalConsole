import pytest
from django.contrib.auth import get_user_model

from finance.models import IncomeRecord, RentPayment, StockPosition

User = get_user_model()


@pytest.mark.django_db
def test_income_crud_scoped_to_user(auth_client, user):
    resp = auth_client.post(
        "/api/finance/income/",
        {"source": "Salary", "amount": "6000.00", "period": "monthly"},
        format="json",
    )
    assert resp.status_code == 201
    assert resp.data["monthly_equivalent"] == pytest.approx(6000.0)

    # Another user's income is not visible.
    other = User.objects.create_user(username="bob", password="x")
    IncomeRecord.objects.create(user=other, source="Other", amount=100, period="monthly")

    listing = auth_client.get("/api/finance/income/")
    assert listing.status_code == 200
    assert len(listing.data) == 1
    assert listing.data[0]["source"] == "Salary"


@pytest.mark.django_db
def test_rent_toggle_paid(auth_client):
    created = auth_client.post(
        "/api/finance/rent/",
        {"period": "2026-06-01", "amount": "2200.00", "paid": False},
        format="json",
    )
    assert created.status_code == 201
    rent_id = created.data["id"]

    patched = auth_client.patch(
        f"/api/finance/rent/{rent_id}/", {"paid": True}, format="json"
    )
    assert patched.status_code == 200
    assert patched.data["paid"] is True


@pytest.mark.django_db
def test_stock_list_includes_live_price(auth_client, user, monkeypatch):
    StockPosition.objects.create(user=user, ticker="CBA.AX", quantity=10, avg_cost=100)

    monkeypatch.setattr(
        "finance.views.prices.get_quote",
        lambda ticker: {"price": 150.0, "currency": "AUD", "change_pct": 1.2},
    )

    resp = auth_client.get("/api/finance/stocks/")
    assert resp.status_code == 200
    assert resp.data[0]["price"] == 150.0
    assert resp.data[0]["market_value"] == 1500.0


@pytest.mark.django_db
def test_summary_aggregates(auth_client, user, monkeypatch):
    IncomeRecord.objects.create(user=user, source="Salary", amount=6000, period="monthly")
    RentPayment.objects.create(
        user=user, period="2026-06-01", amount=2200, paid=True
    )
    StockPosition.objects.create(user=user, ticker="VAS.AX", quantity=5, avg_cost=80)

    monkeypatch.setattr(
        "finance.views.prices.get_quote",
        lambda ticker: {"price": 100.0, "currency": "AUD", "change_pct": 0.5},
    )
    monkeypatch.setattr(
        "finance.views.date",
        type("D", (), {"today": staticmethod(lambda: __import__("datetime").date(2026, 6, 15))}),
    )

    resp = auth_client.get("/api/finance/summary/")
    assert resp.status_code == 200
    assert resp.data["monthly_income"] == pytest.approx(6000.0)
    assert resp.data["rent_status"]["paid"] is True
    assert resp.data["portfolio_value"] == 500.0
