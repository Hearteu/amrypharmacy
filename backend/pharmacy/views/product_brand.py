from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Brand as BrandModel


class Brand(APIView):
    def get(self, request, brand_id=None):
        try:
            if brand_id is not None:
                try:
                    obj = BrandModel.objects.get(brand_id=brand_id)
                except BrandModel.DoesNotExist:
                    return Response({"error": "No brand found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = BrandModel.objects.all()
            if not qs.exists():
                return Response({"error": "No brand found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = BrandModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, brand_id):
        data = request.data
        try:
            updated = BrandModel.objects.filter(brand_id=brand_id).update(**data)
            if updated:
                obj = BrandModel.objects.get(brand_id=brand_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Category not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, brand_id):
        try:
            deleted, _ = BrandModel.objects.filter(brand_id=brand_id).delete()
            if deleted:
                return Response({"message": "Category deleted successfully"}, status=204)
            return Response({"error": "Category not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
