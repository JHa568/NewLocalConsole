from datetime import date

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Imported so live-price enrichment (resolved in StockPositionSerializer) and the
# dashboard date are patchable as ``finance.views.prices`` / ``finance.views.date``.
from . import prices  # noqa: F401
from .models import IncomeRecord, ManualBalance, RentPayment, StockPosition
from .serializers import (
    IncomeRecordSerializer,
    ManualBalanceSerializer,
    RentPaymentSerializer,
    StockPositionSerializer,
)
from .services.summary import build_summary


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


class StockViewSet(OwnedViewSet):
    # Live-price fields are attached by StockPositionSerializer.to_representation,
    # so the default list/retrieve already return enriched payloads.
    queryset = StockPosition.objects.all()
    serializer_class = StockPositionSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def summary(request):
    return Response(build_summary(request.user, today=date.today()))
