from django.conf import settings
from django.db import models


class PomodoroSession(models.Model):
    """A completed Pomodoro work interval, tagged with the calendar event that
    was active when it finished."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    # Task pulled from the Google Calendar event happening when the timer ran.
    task_title = models.CharField(max_length=255, blank=True)
    calendar_event_id = models.CharField(max_length=255, blank=True)
    duration_minutes = models.PositiveIntegerField(default=25)
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-completed_at"]
        indexes = [
            # Matches the "my sessions, newest first" list query.
            models.Index(fields=["user", "-completed_at"]),
        ]

    def __str__(self):
        return f"{self.task_title or 'Untitled'} ({self.duration_minutes}m)"
