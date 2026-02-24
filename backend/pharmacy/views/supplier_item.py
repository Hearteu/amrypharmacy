from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import SupplierItem as SupplierItemModel


class SupplierItem(APIView):
    def get(self, request, supplier_id=None):
        try:
            qs = SupplierItemModel.objects.select_related(
                'supplier', 'product', 'product__drug'
            )

            if supplier_id is not None:
                qs = qs.filter(supplier_id=supplier_id)

            if not qs.exists():
                return Response({"error": "No supplier items found"}, status=404)

            supplier_items = []
            for item in qs:
                product_name = item.product.product_name if item.product else ""

                # Check if the product has drug details
                drug = getattr(item.product, 'drug', None)
                if drug:
                    dosage_form = (drug.dosage_form or "").strip()
                    dosage_strength = (drug.dosage_strength or "").strip()
                    if dosage_form or dosage_strength:
                        product_name += f" {dosage_form} {dosage_strength}"

                supplier_items.append({
                    "supplier_item_id": item.supplier_item_id,
                    "supplier_id": item.supplier_id,
                    "supplier_name": item.supplier.supplier_name if item.supplier else None,
                    "product_id": item.product_id,
                    "product_name": product_name,
                    "unit_id": item.product.unit_id if item.product else None,
                    "supplier_price": float(item.supplier_price),
                })

            return Response(supplier_items, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        try:
            data = request.data
            obj = SupplierItemModel.objects.create(
                supplier_id=data.get("supplier_id"),
                product_id=data.get("product_id"),
                supplier_price=data.get("supplier_price"),
            )

            return Response({
                "message": "Supplier item added successfully",
                "supplier_item": model_to_dict(obj),
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def put(self, request, supplier_item_id=None):
        try:
            if supplier_item_id is None:
                return Response({"error": "Supplier Item ID is required"}, status=400)

            if not SupplierItemModel.objects.filter(supplier_item_id=supplier_item_id).exists():
                return Response({"error": "Supplier item not found"}, status=404)

            data = request.data
            update_data = {}
            if data.get("supplier_id") is not None:
                update_data["supplier_id"] = data["supplier_id"]
            if data.get("product_id") is not None:
                update_data["product_id"] = data["product_id"]
            if data.get("supplier_price") is not None:
                update_data["supplier_price"] = data["supplier_price"]

            SupplierItemModel.objects.filter(supplier_item_id=supplier_item_id).update(**update_data)
            return Response({"message": "Supplier item updated successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def delete(self, request, supplier_item_id=None):
        try:
            if supplier_item_id is None:
                return Response({"error": "Supplier Item ID is required"}, status=400)

            if not SupplierItemModel.objects.filter(supplier_item_id=supplier_item_id).exists():
                return Response({"error": "Supplier item not found"}, status=404)

            SupplierItemModel.objects.filter(supplier_item_id=supplier_item_id).delete()
            return Response({"message": "Supplier item deleted successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
