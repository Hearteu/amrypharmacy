from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import PurchaseOrderItemStatus


class Purchase_Order_Item_Status(APIView):
    def get(self, request, purchase_order_item_status_id=None):
        try:
            if purchase_order_item_status_id is not None:
                try:
                    obj = PurchaseOrderItemStatus.objects.get(purchase_order_item_status_id=purchase_order_item_status_id)
                except PurchaseOrderItemStatus.DoesNotExist:
                    return Response({"error": "No Purchase_Order_Item_Status found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = PurchaseOrderItemStatus.objects.all()
            if not qs.exists():
                return Response({"error": "No Purchase_Order_Item_Status found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = PurchaseOrderItemStatus.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, purchase_order_item_status_id):
        data = request.data
        try:
            updated = PurchaseOrderItemStatus.objects.filter(purchase_order_item_status_id=purchase_order_item_status_id).update(**data)
            if updated:
                obj = PurchaseOrderItemStatus.objects.get(purchase_order_item_status_id=purchase_order_item_status_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Purchase_Order_Item_Status not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, purchase_order_item_status_id):
        try:
            deleted, _ = PurchaseOrderItemStatus.objects.filter(purchase_order_item_status_id=purchase_order_item_status_id).delete()
            if deleted:
                return Response({"message": "Purchase_Order_Item_Status deleted successfully"}, status=204)
            return Response({"error": "Purchase_Order_Item_Status not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)