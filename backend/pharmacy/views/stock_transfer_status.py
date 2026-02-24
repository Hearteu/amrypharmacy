from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import StockTransferStatus


class Stock_Transfer_Status(APIView):
    def get(self, request, stock_transfer_status_id=None):
        try:
            if stock_transfer_status_id is not None:
                try:
                    obj = StockTransferStatus.objects.get(stock_transfer_status_id=stock_transfer_status_id)
                except StockTransferStatus.DoesNotExist:
                    return Response({"error": "No Stock_Transfer_Status found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = StockTransferStatus.objects.all()
            if not qs.exists():
                return Response({"error": "No Stock_Transfer_Status found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = StockTransferStatus.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, stock_transfer_status_id):
        data = request.data
        try:
            updated = StockTransferStatus.objects.filter(stock_transfer_status_id=stock_transfer_status_id).update(**data)
            if updated:
                obj = StockTransferStatus.objects.get(stock_transfer_status_id=stock_transfer_status_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Stock_Transfer_Status not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, stock_transfer_status_id):
        try:
            deleted, _ = StockTransferStatus.objects.filter(stock_transfer_status_id=stock_transfer_status_id).delete()
            if deleted:
                return Response({"message": "Stock_Transfer_Status deleted successfully"}, status=204)
            return Response({"error": "Stock_Transfer_Status not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)