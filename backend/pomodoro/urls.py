from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("sessions", views.PomodoroSessionViewSet, basename="pomodoro-sessions")

urlpatterns = [
    path("current-task/", views.current_task, name="pomodoro-current-task"),
    path("", include(router.urls)),
]
