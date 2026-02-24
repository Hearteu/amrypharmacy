from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Physician as PhysicianModel


class Physician(APIView):
    def get(self, request, physician_id=None):
        try:
            if physician_id is not None:
                try:
                    obj = PhysicianModel.objects.get(physician_id=physician_id)
                except PhysicianModel.DoesNotExist:
                    return Response({"error": "No Physician found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = PhysicianModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Physician found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = PhysicianModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, physician_id):
        data = request.data
        try:
            updated = PhysicianModel.objects.filter(physician_id=physician_id).update(**data)
            if updated:
                obj = PhysicianModel.objects.get(physician_id=physician_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Physician not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, physician_id):
        try:
            deleted, _ = PhysicianModel.objects.filter(physician_id=physician_id).delete()
            if deleted:
                return Response({"message": "Physician deleted successfully"}, status=204)
            return Response({"error": "Physician not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
