from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Unit as UnitModel


class Unit(APIView):
    def get(self, request, unit_id=None):
        try:
            if unit_id is not None:
                try:
                    obj = UnitModel.objects.get(unit_id=unit_id)
                except UnitModel.DoesNotExist:
                    return Response({"error": "No Unit found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = UnitModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Unit found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = UnitModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, unit_id):
        data = request.data
        try:
            updated = UnitModel.objects.filter(unit_id=unit_id).update(**data)
            if updated:
                obj = UnitModel.objects.get(unit_id=unit_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Unit not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, unit_id):
        try:
            deleted, _ = UnitModel.objects.filter(unit_id=unit_id).delete()
            if deleted:
                return Response({"message": "Unit deleted successfully"}, status=204)
            return Response({"error": "Unit not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
