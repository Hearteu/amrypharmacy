from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Location as LocationModel


class Location(APIView):
    def get(self, request, location_id=None):
        try:
            if location_id is not None:
                try:
                    obj = LocationModel.objects.get(location_id=location_id)
                except LocationModel.DoesNotExist:
                    return Response({"error": "No Location found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = LocationModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Location found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = LocationModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, location_id):
        data = request.data
        try:
            updated = LocationModel.objects.filter(location_id=location_id).update(**data)
            if updated:
                obj = LocationModel.objects.get(location_id=location_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Location not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, location_id):
        try:
            deleted, _ = LocationModel.objects.filter(location_id=location_id).delete()
            if deleted:
                return Response({"message": "Location deleted successfully"}, status=204)
            return Response({"error": "Location not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
