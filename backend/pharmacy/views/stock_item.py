import traceback

from django.db import transaction
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Brand, Drug, Location, Product, ProductCategory,
                       StockItem as StockItemModel, StockTransaction)


class StockItem(APIView):
    def get(self, request):
        try:
            threshold = request.query_params.get('threshold')
            branch = request.query_params.get('branch')  # Treated as location_id

            qs = StockItemModel.objects.select_related(
                'product', 'product__brand', 'product__category',
                'product__unit', 'location'
            )

            if threshold is not None:
                qs = qs.filter(quantity__lt=int(threshold))

            if branch is not None:
                qs = qs.filter(location_id=int(branch))

            if not qs.exists():
                return Response([], status=200)

            formatted_items = []
            for item in qs:
                product = item.product
                location_name = item.location.location if item.location else 'Unknown Location'

                # Get drug info
                drug = getattr(product, 'drug', None)
                dosage_parts = []
                if drug:
                    if drug.dosage_form:
                        dosage_parts.append(drug.dosage_form)
                    if drug.dosage_strength:
                        dosage_parts.append(drug.dosage_strength)
                dosage = ' '.join(dosage_parts)
                full_name = f"{product.product_name} {dosage}".strip()

                product_details = {
                    "product_id": product.product_id,
                    "full_product_name": full_name,
                    "current_price": float(product.current_price),
                    "category_id": product.category_id,
                    "category_name": product.category.category_name.strip() if product.category and product.category.category_name else None,
                    "brand_id": product.brand_id,
                    "brand_name": product.brand.brand_name if product.brand else None,
                }

                formatted_items.append({
                    "product_id": product.product_id,
                    "location_id": item.location_id,
                    "location_name": location_name,
                    "quantity": item.quantity,
                    "product_details": product_details,
                })

            return Response(formatted_items, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = StockItemModel.objects.create(**data)
            return Response({
                "stock_item_id": obj.stock_item_id,
                "product_id": obj.product_id,
                "location_id": obj.location_id,
                "quantity": obj.quantity,
            }, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @transaction.atomic
    def put(self, request, product_id):
        data = request.data
        location_id = int(data.get("location_id"))
        product_id = data.get("product_id")
        quantity = data.get("quantity")
        transaction_type = data.get("transaction_type")

        try:
            quantity = int(quantity)

            # 1. Get current stock quantity
            try:
                stock_item = StockItemModel.objects.get(product_id=product_id, location_id=location_id)
            except StockItemModel.DoesNotExist:
                return Response({"error": "Stock item not found"}, status=404)

            current_quantity = stock_item.quantity

            # 2. Insert stock transaction
            StockTransaction.objects.create(
                stock_item_id=stock_item.stock_item_id,
                transaction_type=transaction_type,
                quantity_change=current_quantity - quantity,
                src_location=location_id,
            )

            # 3. Update stock item quantity
            stock_item.quantity = quantity
            stock_item.save()

            return Response({"message": "Disposal recorded and quantities updated"}, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def delete(self, request, product_id):
        try:
            deleted, _ = StockItemModel.objects.filter(product_id=product_id).delete()
            if deleted:
                return Response({"message": "Stock_Item deleted successfully"}, status=204)
            return Response({"error": "Stock_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
