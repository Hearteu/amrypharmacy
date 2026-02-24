from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import PriceHistory as PriceHistoryModel


class PriceHistory(APIView):
    def get(self, request, price_history_id=None):
        try:
            if price_history_id is not None:
                try:
                    obj = PriceHistoryModel.objects.get(price_history_id=price_history_id)
                except PriceHistoryModel.DoesNotExist:
                    return Response({"error": "No PriceHistory found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = PriceHistoryModel.objects.all()
            if not qs.exists():
                return Response({"error": "No PriceHistory found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = PriceHistoryModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, price_history_id):
        data = request.data
        try:
            updated = PriceHistoryModel.objects.filter(price_history_id=price_history_id).update(**data)
            if updated:
                obj = PriceHistoryModel.objects.get(price_history_id=price_history_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Price_History not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, price_history_id):
        try:
            deleted, _ = PriceHistoryModel.objects.filter(price_history_id=price_history_id).delete()
            if deleted:
                return Response({"message": "Price_History deleted successfully"}, status=204)
            return Response({"error": "Price_History not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
