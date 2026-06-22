from rest_framework import serializers

from .models import PomodoroSession


class PomodoroSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = [
            "id",
            "task_title",
            "calendar_event_id",
            "duration_minutes",
            "started_at",
            "completed_at",
        ]
        read_only_fields = ["id", "completed_at"]
