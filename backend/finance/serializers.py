from rest_framework import serializers

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
    # Live-price fields, populated by the view.
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


class ManualBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualBalance
        fields = ["id", "label", "amount", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
