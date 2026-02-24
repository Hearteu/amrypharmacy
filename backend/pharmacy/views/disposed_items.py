from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import DisposedItem


class DisposedItems(APIView):
    def get(self, request, disposed_items_id=None):
        try:
            if disposed_items_id is not None:
                try:
                    obj = DisposedItem.objects.get(disposed_item_id=disposed_items_id)
                except DisposedItem.DoesNotExist:
                    return Response({"error": "No Disposed Items found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = DisposedItem.objects.all()
            if not qs.exists():
                return Response({"error": "No Disposed Items found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = DisposedItem.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, disposed_items_id):
        data = request.data
        try:
            updated = DisposedItem.objects.filter(disposed_item_id=disposed_items_id).update(**data)
            if updated:
                obj = DisposedItem.objects.get(disposed_item_id=disposed_items_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Disposed Items not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, disposed_items_id):
        try:
            deleted, _ = DisposedItem.objects.filter(disposed_item_id=disposed_items_id).delete()
            if deleted:
                return Response({"message": "Disposed Items deleted successfully"}, status=204)
            return Response({"error": "Disposed Items not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
