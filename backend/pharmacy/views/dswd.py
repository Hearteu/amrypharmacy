from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import DswdOrder as DswdOrderModel


class DswdOrder(APIView):
    def get(self, request, dswd_order_id=None):
        try:
            if dswd_order_id is not None:
                try:
                    obj = DswdOrderModel.objects.get(dswd_order_id=dswd_order_id)
                except DswdOrderModel.DoesNotExist:
                    return Response({"error": "No DSWD Order found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = DswdOrderModel.objects.all()
            if not qs.exists():
                return Response({"error": "No DSWD Order found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = DswdOrderModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, dswd_order_id):
        data = request.data
        try:
            updated = DswdOrderModel.objects.filter(dswd_order_id=dswd_order_id).update(**data)
            if updated:
                obj = DswdOrderModel.objects.get(dswd_order_id=dswd_order_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "DSWD Order not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, dswd_order_id):
        try:
            deleted, _ = DswdOrderModel.objects.filter(dswd_order_id=dswd_order_id).delete()
            if deleted:
                return Response({"message": "DSWD Order deleted successfully"}, status=204)
            return Response({"error": "DSWD Order not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
