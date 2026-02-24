from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Order as OrderModel


class Order(APIView):
    def get(self, request, order_id=None):
        try:
            if order_id is not None:
                try:
                    obj = OrderModel.objects.get(order_id=order_id)
                except OrderModel.DoesNotExist:
                    return Response({"error": "No Order found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = OrderModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Order found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = OrderModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, order_id):
        data = request.data
        try:
            updated = OrderModel.objects.filter(order_id=order_id).update(**data)
            if updated:
                obj = OrderModel.objects.get(order_id=order_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Order not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, order_id):
        try:
            deleted, _ = OrderModel.objects.filter(order_id=order_id).delete()
            if deleted:
                return Response({"message": "Order deleted successfully"}, status=204)
            return Response({"error": "Order not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
