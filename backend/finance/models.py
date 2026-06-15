from django.conf import settings
from django.db import models


class OwnedModel(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class IncomeRecord(OwnedModel):
    class Period(models.TextChoices):
        WEEKLY = "weekly", "Weekly"
        FORTNIGHTLY = "fortnightly", "Fortnightly"
        MONTHLY = "monthly", "Monthly"
        ANNUAL = "annual", "Annual"
        ONE_OFF = "one_off", "One-off"

    source = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    period = models.CharField(
        max_length=20, choices=Period.choices, default=Period.MONTHLY
    )
    received_on = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    # Normalisation factor to a monthly figure for dashboard aggregation.
    _MONTHLY_FACTORS = {
        Period.WEEKLY: 52 / 12,
        Period.FORTNIGHTLY: 26 / 12,
        Period.MONTHLY: 1,
        Period.ANNUAL: 1 / 12,
        Period.ONE_OFF: 0,
    }

    @property
    def monthly_equivalent(self):
        return float(self.amount) * self._MONTHLY_FACTORS.get(self.period, 0)


class RentPayment(OwnedModel):
    # Period stored as the first day of the month it covers, e.g. 2026-06-01.
    period = models.DateField(help_text="First day of the month this rent covers")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-period"]
        unique_together = ("user", "period")


class StockPosition(OwnedModel):
    ticker = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=16, decimal_places=4)
    avg_cost = models.DecimalField(
        max_digits=12, decimal_places=4, help_text="Average cost per share"
    )

    class Meta:
        ordering = ["ticker"]
        unique_together = ("user", "ticker")

    def __str__(self):
        return f"{self.ticker} x{self.quantity}"


class ManualBalance(OwnedModel):
    label = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        ordering = ["label"]
