from django.urls import path

from . import views

urlpatterns = [
    path("status/", views.StatusView.as_view(), name="calendar-status"),
    path("events/", views.EventListCreateView.as_view(), name="calendar-events"),
    path(
        "events/<str:event_id>/",
        views.EventDetailView.as_view(),
        name="calendar-event-detail",
    ),
    path("tasks/", views.TaskListCreateView.as_view(), name="calendar-tasks"),
    path(
        "tasks/<str:task_id>/",
        views.TaskDetailView.as_view(),
        name="calendar-task-detail",
    ),
]
