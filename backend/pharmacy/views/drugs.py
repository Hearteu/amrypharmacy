from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Drug, Product


class Drugs(APIView):
    def get(self, request, drugs_id=None):
        try:
            if drugs_id is not None:
                try:
                    obj = Drug.objects.get(drug_id=drugs_id)
                except Drug.DoesNotExist:
                    return Response({"error": "No Drugs found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = Drug.objects.all()
            if not qs.exists():
                return Response({"error": "No Drugs found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data.copy()
        try:
            # Extract product-related fields
            product_fields = ["brand_id", "category_id", "product_name", "current_price", "net_content"]
            product_data = {key: data.pop(key) for key in product_fields if key in data}

            # Insert into Products table first
            product = Product.objects.create(**product_data)

            # Insert into Drugs table with product_id
            data["product_id"] = product.product_id
            drug = Drug.objects.create(**data)

            return Response(model_to_dict(drug), status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, drugs_id):
        data = request.data
        try:
            updated = Drug.objects.filter(drug_id=drugs_id).update(**data)
            if updated:
                obj = Drug.objects.get(drug_id=drugs_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Drugs not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, drugs_id):
        try:
            deleted, _ = Drug.objects.filter(drug_id=drugs_id).delete()
            if deleted:
                return Response({"message": "Drugs deleted successfully"}, status=204)
            return Response({"error": "Drugs not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
