from rest_framework import serializers

from . import prices
from .models import IncomeRecord, ManualBalance, RentPayment, StockPosition


class IncomeRecordSerializer(serializers.ModelSerializer):
    monthly_equivalent = serializers.FloatField(read_only=True)

    class Meta:
        model = IncomeRecord
        fields = [
            "id",
            "source",
            "amount",
            "period",
            "received_on",
            "monthly_equivalent",
            "created_at",
        ]
        read_only_fields = ["id", "monthly_equivalent", "created_at"]


class RentPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentPayment
        fields = [
            "id",
            "period",
            "amount",
            "paid",
            "due_date",
            "paid_date",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class StockPositionSerializer(serializers.ModelSerializer):
    # Live-price fields, enriched in to_representation() from the price provider.
    price = serializers.FloatField(read_only=True)
    currency = serializers.CharField(read_only=True)
    change_pct = serializers.FloatField(read_only=True)
    market_value = serializers.FloatField(read_only=True)

    class Meta:
        model = StockPosition
        fields = [
            "id",
            "ticker",
            "quantity",
            "avg_cost",
            "price",
            "currency",
            "change_pct",
            "market_value",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "price",
            "currency",
            "change_pct",
            "market_value",
            "created_at",
        ]

    def to_representation(self, instance):
        # The four live-price fields have no model attribute, so the base
        # representation skips them; we attach a (cached) quote here.
        data = super().to_representation(instance)
        quote = prices.get_quote(instance.ticker)
        price = quote.get("price")
        data["price"] = price
        data["currency"] = quote.get("currency")
        data["change_pct"] = quote.get("change_pct")
        data["market_value"] = (
            round(price * float(instance.quantity), 2) if price is not None else None
        )
        return data


class ManualBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualBalance
        fields = ["id", "label", "amount", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
