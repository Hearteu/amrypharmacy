from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Status as StatusModel


class Status(APIView):
    def get(self, request, status_id=None):
        try:
            if status_id is not None:
                try:
                    obj = StatusModel.objects.get(status_id=status_id)
                except StatusModel.DoesNotExist:
                    return Response({"error": "No Status found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = StatusModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Status found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = StatusModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, status_id):
        data = request.data
        try:
            updated = StatusModel.objects.filter(status_id=status_id).update(**data)
            if updated:
                obj = StatusModel.objects.get(status_id=status_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Status not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, status_id):
        try:
            deleted, _ = StatusModel.objects.filter(status_id=status_id).delete()
            if deleted:
                return Response({"message": "Status deleted successfully"}, status=204)
            return Response({"error": "Status not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
