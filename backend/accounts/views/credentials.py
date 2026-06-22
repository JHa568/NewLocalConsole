from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import WebAuthnCredentialSerializer


class CredentialListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        creds = request.user.webauthn_credentials.all()
        return Response(WebAuthnCredentialSerializer(creds, many=True).data)


class CredentialDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        deleted, _ = request.user.webauthn_credentials.filter(pk=pk).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
