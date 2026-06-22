from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from calendar_app import google_service

from .models import PomodoroSession
from .serializers import PomodoroSessionSerializer


class PomodoroSessionViewSet(viewsets.ModelViewSet):
    """History of completed Pomodoro intervals, scoped to the current user."""

    serializer_class = PomodoroSessionSerializer
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return PomodoroSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_task(request):
    """The Google Calendar event happening right now, used to tag a session.

    A missing Google connection raises ``GoogleNotConnectedError``, which the
    global DRF exception handler turns into a 503.
    """
    event = google_service.get_current_event()
    if not event:
        return Response({"event_id": None, "summary": None})
    return Response(
        {"event_id": event.get("id"), "summary": event.get("summary")}
    )
