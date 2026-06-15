from datetime import date

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import prices
from .models import IncomeRecord, ManualBalance, RentPayment, StockPosition
from .serializers import (
    IncomeRecordSerializer,
    ManualBalanceSerializer,
    RentPaymentSerializer,
    StockPositionSerializer,
)


class OwnedViewSet(viewsets.ModelViewSet):
    """Scopes every queryset to the requesting user."""

    def get_queryset(self):
        return self.queryset.model.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class IncomeViewSet(OwnedViewSet):
    queryset = IncomeRecord.objects.all()
    serializer_class = IncomeRecordSerializer


class RentViewSet(OwnedViewSet):
    queryset = RentPayment.objects.all()
    serializer_class = RentPaymentSerializer


class ManualBalanceViewSet(OwnedViewSet):
    queryset = ManualBalance.objects.all()
    serializer_class = ManualBalanceSerializer


def _position_with_price(position):
    quote = prices.get_quote(position.ticker)
    data = StockPositionSerializer(position).data
    price = quote.get("price")
    data["price"] = price
    data["currency"] = quote.get("currency")
    data["change_pct"] = quote.get("change_pct")
    data["market_value"] = (
        round(price * float(position.quantity), 2) if price is not None else None
    )
    return data


class StockViewSet(OwnedViewSet):
    queryset = StockPosition.objects.all()
    serializer_class = StockPositionSerializer

    def list(self, request, *args, **kwargs):
        positions = self.get_queryset()
        return Response([_position_with_price(p) for p in positions])

    def retrieve(self, request, *args, **kwargs):
        return Response(_position_with_price(self.get_object()))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def summary(request):
    user = request.user

    income_qs = IncomeRecord.objects.filter(user=user)
    monthly_income = round(sum(i.monthly_equivalent for i in income_qs), 2)

    today = date.today()
    current_period = today.replace(day=1)
    current_rent = RentPayment.objects.filter(user=user, period=current_period).first()
    rent_status = {
        "period": current_period.isoformat(),
        "exists": current_rent is not None,
        "paid": current_rent.paid if current_rent else False,
        "amount": float(current_rent.amount) if current_rent else None,
    }

    positions = StockPosition.objects.filter(user=user)
    portfolio_value = 0.0
    position_data = []
    for p in positions:
        enriched = _position_with_price(p)
        position_data.append(enriched)
        if enriched["market_value"]:
            portfolio_value += enriched["market_value"]

    balances = ManualBalance.objects.filter(user=user)
    balances_total = float(sum(b.amount for b in balances))

    net_worth = round(portfolio_value + balances_total, 2)

    return Response(
        {
            "monthly_income": monthly_income,
            "rent_status": rent_status,
            "portfolio_value": round(portfolio_value, 2),
            "positions": position_data,
            "balances_total": round(balances_total, 2),
            "net_worth_estimate": net_worth,
        }
    )
