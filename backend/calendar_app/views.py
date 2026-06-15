from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import google_service
from .google_service import GoogleNotConnectedError


def _not_connected_response():
    return Response(
        {"detail": "Google account not connected.", "connected": False},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


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
        try:
            events = google_service.list_events(time_min, time_max)
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(events)

    def post(self, request):
        data = request.data
        try:
            event = google_service.create_event(
                summary=data.get("summary", ""),
                description=data.get("description"),
                all_day=bool(data.get("all_day")),
                start=data.get("start"),
                end=data.get("end"),
                time_zone=data.get("time_zone", "UTC"),
            )
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(event, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, event_id):
        data = request.data
        try:
            event = google_service.update_event(
                event_id,
                summary=data.get("summary", ""),
                description=data.get("description"),
                all_day=bool(data.get("all_day")),
                start=data.get("start"),
                end=data.get("end"),
                time_zone=data.get("time_zone", "UTC"),
            )
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(event)

    def delete(self, request, event_id):
        try:
            google_service.delete_event(event_id)
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            tasks = google_service.list_tasks()
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(tasks)

    def post(self, request):
        data = request.data
        try:
            task = google_service.create_task(
                title=data.get("title", ""),
                notes=data.get("notes"),
                due=data.get("due"),
                completed=bool(data.get("completed")),
            )
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(task, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id):
        data = request.data
        try:
            task = google_service.update_task(
                task_id,
                title=data.get("title", ""),
                notes=data.get("notes"),
                due=data.get("due"),
                completed=bool(data.get("completed")),
            )
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(task)

    def delete(self, request, task_id):
        try:
            google_service.delete_task(task_id)
        except GoogleNotConnectedError:
            return _not_connected_response()
        return Response(status=status.HTTP_204_NO_CONTENT)
