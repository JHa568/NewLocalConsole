"""Dashboard summary aggregation.

Pulled out of the ``summary`` view so the aggregation is testable on its own and
reuses ``StockPositionSerializer`` for live-price enrichment instead of
duplicating it.
"""

from ..models import IncomeRecord, ManualBalance, RentPayment, StockPosition
from ..serializers import StockPositionSerializer


def build_summary(user, today):
    """Return the finance dashboard payload for ``user`` as of ``today``."""
    income_qs = IncomeRecord.objects.filter(user=user)
    monthly_income = round(sum(i.monthly_equivalent for i in income_qs), 2)

    current_period = today.replace(day=1)
    current_rent = RentPayment.objects.filter(user=user, period=current_period).first()
    rent_status = {
        "period": current_period.isoformat(),
        "exists": current_rent is not None,
        "paid": current_rent.paid if current_rent else False,
        "amount": float(current_rent.amount) if current_rent else None,
    }

    positions = StockPosition.objects.filter(user=user)
    position_data = StockPositionSerializer(positions, many=True).data
    portfolio_value = sum(p["market_value"] for p in position_data if p["market_value"])

    balances = ManualBalance.objects.filter(user=user)
    balances_total = float(sum(b.amount for b in balances))

    net_worth = round(portfolio_value + balances_total, 2)

    return {
        "monthly_income": monthly_income,
        "rent_status": rent_status,
        "portfolio_value": round(portfolio_value, 2),
        "positions": position_data,
        "balances_total": round(balances_total, 2),
        "net_worth_estimate": net_worth,
    }
