from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import PurchaseOrderStatus


class Purchase_Order_Status(APIView):
    def get(self, request, purchase_order_status_id=None):
        try:
            if purchase_order_status_id is not None:
                try:
                    obj = PurchaseOrderStatus.objects.get(purchase_order_status_id=purchase_order_status_id)
                except PurchaseOrderStatus.DoesNotExist:
                    return Response({"error": "No Purchase_Order_Status found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = PurchaseOrderStatus.objects.all()
            if not qs.exists():
                return Response({"error": "No Purchase_Order_Status found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = PurchaseOrderStatus.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, purchase_order_status_id):
        data = request.data
        try:
            updated = PurchaseOrderStatus.objects.filter(purchase_order_status_id=purchase_order_status_id).update(**data)
            if updated:
                obj = PurchaseOrderStatus.objects.get(purchase_order_status_id=purchase_order_status_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Purchase_Order_Status not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, purchase_order_status_id):
        try:
            deleted, _ = PurchaseOrderStatus.objects.filter(purchase_order_status_id=purchase_order_status_id).delete()
            if deleted:
                return Response({"message": "Purchase_Order_Status deleted successfully"}, status=204)
            return Response({"error": "Purchase_Order_Status not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)