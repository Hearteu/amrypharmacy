from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Prescription as PrescriptionModel


class Prescription(APIView):
    def get(self, request, prescription_id=None):
        try:
            if prescription_id is not None:
                try:
                    obj = PrescriptionModel.objects.get(prescription_id=prescription_id)
                except PrescriptionModel.DoesNotExist:
                    return Response({"error": "No Prescription found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = PrescriptionModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Prescription found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = PrescriptionModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, prescription_id):
        data = request.data
        try:
            updated = PrescriptionModel.objects.filter(prescription_id=prescription_id).update(**data)
            if updated:
                obj = PrescriptionModel.objects.get(prescription_id=prescription_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Prescription not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, prescription_id):
        try:
            deleted, _ = PrescriptionModel.objects.filter(prescription_id=prescription_id).delete()
            if deleted:
                return Response({"message": "Prescription deleted successfully"}, status=204)
            return Response({"error": "Prescription not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
