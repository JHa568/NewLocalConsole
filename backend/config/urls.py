from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/finance/", include("finance.urls")),
    path("api/calendar/", include("calendar_app.urls")),
    path("api/pomodoro/", include("pomodoro.urls")),
]
