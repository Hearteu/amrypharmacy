from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Inventory as InventoryModel


class Inventory(APIView):
    def get(self, request, inventory_id=None):
        try:
            if inventory_id is not None:
                try:
                    obj = InventoryModel.objects.get(inventory_id=inventory_id)
                except InventoryModel.DoesNotExist:
                    return Response({"error": "No Inventory found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = InventoryModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Inventory found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = InventoryModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, inventory_id):
        data = request.data
        try:
            updated = InventoryModel.objects.filter(inventory_id=inventory_id).update(**data)
            if updated:
                obj = InventoryModel.objects.get(inventory_id=inventory_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Inventory not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, inventory_id):
        try:
            deleted, _ = InventoryModel.objects.filter(inventory_id=inventory_id).delete()
            if deleted:
                return Response({"message": "Inventory deleted successfully"}, status=204)
            return Response({"error": "Inventory not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
