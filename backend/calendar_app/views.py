from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import google_service
from .serializers import EventInputSerializer, TaskInputSerializer

# GoogleNotConnectedError is handled globally by
# calendar_app.exceptions.google_exception_handler (registered as DRF's
# EXCEPTION_HANDLER), so the views below let it propagate.


class StatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"connected": google_service.is_connected()})


class EventListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        time_min = request.query_params.get("start")
        time_max = request.query_params.get("end")
        if not time_min or not time_max:
            return Response(
                {"detail": "start and end query params are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        events = google_service.list_events(time_min, time_max)
        return Response(events)

    def post(self, request):
        serializer = EventInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = google_service.create_event(**serializer.validated_data)
        return Response(event, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, event_id):
        serializer = EventInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = google_service.update_event(event_id, **serializer.validated_data)
        return Response(event)

    def delete(self, request, event_id):
        google_service.delete_event(event_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = google_service.list_tasks()
        return Response(tasks)

    def post(self, request):
        serializer = TaskInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = google_service.create_task(**serializer.validated_data)
        return Response(task, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id):
        serializer = TaskInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = google_service.update_task(task_id, **serializer.validated_data)
        return Response(task)

    def delete(self, request, task_id):
        google_service.delete_task(task_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
