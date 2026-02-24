from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import POSItem


class POS_Item(APIView):
    def get(self, request, pos_item_id=None):
        try:
            if pos_item_id is not None:
                try:
                    obj = POSItem.objects.get(pos_item_id=pos_item_id)
                except POSItem.DoesNotExist:
                    return Response({"error": "No POS_Item found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = POSItem.objects.all()
            if not qs.exists():
                return Response({"error": "No POS_Item found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = POSItem.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, pos_item_id):
        data = request.data
        try:
            updated = POSItem.objects.filter(pos_item_id=pos_item_id).update(**data)
            if updated:
                obj = POSItem.objects.get(pos_item_id=pos_item_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "POS_Item not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, pos_item_id):
        try:
            deleted, _ = POSItem.objects.filter(pos_item_id=pos_item_id).delete()
            if deleted:
                return Response({"message": "POS_Item deleted successfully"}, status=204)
            return Response({"error": "POS_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
