import traceback

from django.db import transaction
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Product, Drug, StockItem, Expiration as ExpirationModel


class Products(APIView):
    def get(self, request):
        try:
            product_id = request.GET.get('product_id')
            location_id = request.GET.get('location_id')

            products = Product.objects.select_related('brand', 'category', 'unit').prefetch_related('stock_items', 'stock_items__location')

            if product_id:
                products = products.filter(product_id=int(product_id))

            if not products.exists():
                return Response({"error": "No products found"}, status=404)

            result = []
            for product in products:
                # Get drug info if exists
                try:
                    drug = product.drug
                    drug_info = {
                        "dosage_strength": drug.dosage_strength,
                        "dosage_form": drug.dosage_form,
                    }
                except Drug.DoesNotExist:
                    drug_info = None

                # Build full product name
                brand_name = (product.brand.brand_name.strip() if product.brand else "")
                if drug_info:
                    dosage_strength = (drug_info.get("dosage_strength") or "").strip()
                    dosage_form = (drug_info.get("dosage_form") or "").strip()
                    full_product_name = f"{product.product_name} {dosage_strength} {dosage_form} ({brand_name})"
                else:
                    full_product_name = f"{product.product_name} {product.net_content or ''} per {product.unit.unit if product.unit else ''} ({brand_name})"

                # Get stock items
                stock_items = product.stock_items.select_related('location').all()
                if location_id:
                    stock_items = stock_items.filter(location_id=int(location_id))

                stock_data = []
                for si in stock_items:
                    # Get expiration details
                    expirations = ExpirationModel.objects.filter(
                        stock_item_id=si.stock_item_id,
                        quantity__gt=0
                    ).order_by('expiry_date')

                    expiry_list = [{
                        "expiry_date": str(exp.expiry_date),
                        "quantity": exp.quantity,
                    } for exp in expirations]

                    stock_data.append({
                        "stock_item_id": si.stock_item_id,
                        "location_id": si.location_id,
                        "quantity": si.quantity,
                        "Location": {
                            "location": si.location.location if si.location else None,
                        },
                        "expirations": expiry_list,
                    })

                result.append({
                    "product_id": product.product_id,
                    "full_product_name": full_product_name,
                    "product_name": product.product_name,
                    "current_price": float(product.current_price),
                    "net_content": product.net_content,
                    "Brand": {
                        "brand_id": product.brand_id,
                        "brand_name": brand_name,
                    } if product.brand else None,
                    "Product_Category": {
                        "category_id": product.category_id,
                        "category_name": product.category.category_name if product.category else None,
                    } if product.category else None,
                    "Unit": {
                        "unit_id": product.unit_id,
                        "unit": product.unit.unit if product.unit else None,
                    } if product.unit else None,
                    "Drugs": drug_info,
                    "Stock_Item": stock_data,
                })

            return Response(result, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @transaction.atomic
    def post(self, request):
        data = request.data
        try:
            # Insert into Products table
            product = Product.objects.create(
                product_name=data["product_name"],
                category_id=data.get("category_id"),
                brand_id=data.get("brand_id"),
                current_price=data.get("current_price", 0),
                net_content=data.get("net_content"),
                unit_id=data.get("unit_id"),
            )

            # Initialize Stock_Item for predefined locations (1, 2, 3)
            for loc_id in [1, 2, 3]:
                StockItem.objects.create(
                    product_id=product.product_id,
                    location_id=loc_id,
                    quantity=0,
                )

            # Insert into Drugs table if drug info provided
            if data.get("dosage_strength") or data.get("dosage_form"):
                Drug.objects.create(
                    product_id=product.product_id,
                    dosage_strength=data.get("dosage_strength"),
                    dosage_form=data.get("dosage_form"),
                )

            return Response({
                "product_id": product.product_id,
                "product_name": product.product_name,
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    def put(self, request, product_id):
        data = request.data
        try:
            if not Product.objects.filter(product_id=product_id).exists():
                return Response({"error": "Product not found"}, status=404)

            # Separate product and drug fields
            drug_fields = ["dosage_strength", "dosage_form"]
            drug_data = {k: v for k, v in data.items() if k in drug_fields}
            product_data = {k: v for k, v in data.items() if k not in drug_fields}

            if product_data:
                Product.objects.filter(product_id=product_id).update(**product_data)

            if drug_data:
                Drug.objects.update_or_create(
                    product_id=product_id,
                    defaults=drug_data,
                )

            product = Product.objects.get(product_id=product_id)
            return Response({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "current_price": float(product.current_price),
            }, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    def delete(self, request, product_id):
        try:
            deleted, _ = Product.objects.filter(product_id=product_id).delete()
            if deleted:
                return Response({"message": "Product deleted successfully"}, status=204)
            return Response({"error": "Product not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
