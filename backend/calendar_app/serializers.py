"""Request serializers for the Google proxy endpoints.

These centralize the field extraction that the views previously did with
``request.data.get(...)``. They are intentionally permissive — same fields and
defaults as before — so no request that worked previously starts failing.
"""

from rest_framework import serializers


class EventInputSerializer(serializers.Serializer):
    summary = serializers.CharField(required=False, default="", allow_blank=True)
    description = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    all_day = serializers.BooleanField(required=False, default=False)
    start = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    end = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    time_zone = serializers.CharField(
        required=False, default="UTC", allow_blank=True
    )


class TaskInputSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, default="", allow_blank=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    due = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    completed = serializers.BooleanField(required=False, default=False)
