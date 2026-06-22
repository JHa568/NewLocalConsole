from django.contrib import admin

from .models import PomodoroSession


@admin.register(PomodoroSession)
class PomodoroSessionAdmin(admin.ModelAdmin):
    list_display = ("task_title", "duration_minutes", "started_at", "completed_at", "user")
    list_filter = ("user",)
