from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ProductCategory as ProductCategoryModel


class ProductCategory(APIView):
    def get(self, request, category_id=None):
        try:
            if category_id is not None:
                try:
                    obj = ProductCategoryModel.objects.get(category_id=category_id)
                except ProductCategoryModel.DoesNotExist:
                    return Response({"error": "No Product Category found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = ProductCategoryModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Product Category found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = ProductCategoryModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, category_id):
        data = request.data
        try:
            updated = ProductCategoryModel.objects.filter(category_id=category_id).update(**data)
            if updated:
                obj = ProductCategoryModel.objects.get(category_id=category_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Category not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, category_id):
        try:
            deleted, _ = ProductCategoryModel.objects.filter(category_id=category_id).delete()
            if deleted:
                return Response({"message": "Category deleted successfully"}, status=204)
            return Response({"error": "Category not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
