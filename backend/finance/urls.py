from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("income", views.IncomeViewSet, basename="income")
router.register("rent", views.RentViewSet, basename="rent")
router.register("stocks", views.StockViewSet, basename="stocks")
router.register("balances", views.ManualBalanceViewSet, basename="balances")

urlpatterns = [
    path("summary/", views.summary, name="finance-summary"),
    path("", include(router.urls)),
]
