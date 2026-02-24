import traceback
from datetime import datetime

from django.db import transaction
from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Brand, Drug, Expiration as ExpirationModel, Location,
                       Product, StockItem, StockTransaction, Unit)


class Expiration(APIView):
    def get(self, request):
        try:
            now = datetime.now()
            start_of_month = now.replace(day=1).strftime('%Y-%m-%d')
            if now.month == 12:
                end_of_month = now.replace(year=now.year + 1, month=1, day=1).strftime('%Y-%m-%d')
            else:
                end_of_month = now.replace(month=now.month + 1, day=1).strftime('%Y-%m-%d')

            expiration_id = request.GET.get('expiration_id')
            product_id = request.GET.get('product_id')
            location_id = request.GET.get('location_id')

            expirations = ExpirationModel.objects.select_related(
                'stock_item', 'stock_item__product', 'stock_item__product__brand',
                'stock_item__product__unit', 'stock_item__location'
            )

            if expiration_id:
                expirations = expirations.filter(expiration_id=int(expiration_id))
            else:
                expirations = expirations.filter(
                    expiry_date__gte=start_of_month,
                    expiry_date__lt=end_of_month,
                )

            # Filter out zero quantity
            expirations = expirations.filter(quantity__gt=0)

            if not expirations.exists():
                return Response({"error": "No Expiration records found."}, status=404)

            enriched_data = []
            for exp in expirations:
                stock_item = exp.stock_item
                product = stock_item.product
                location = stock_item.location

                # Apply filters
                if product_id and stock_item.product_id != int(product_id):
                    continue
                if location_id and stock_item.location_id != int(location_id):
                    continue

                # Get brand name
                brand_name = (product.brand.brand_name.strip() if product.brand else "")

                # Get unit
                unit_name = (product.unit.unit.strip() if product.unit else "")

                # Check if it's a drug
                try:
                    drug = product.drug
                    drug_info = {
                        "dosage_strength": drug.dosage_strength,
                        "dosage_form": drug.dosage_form,
                    }
                except Drug.DoesNotExist:
                    drug_info = None

                # Build full name
                if drug_info:
                    dosage_strength = (drug_info.get("dosage_strength") or "").strip()
                    dosage_form = (drug_info.get("dosage_form") or "").strip()
                    full_product_name = f"{product.product_name} {dosage_strength} {dosage_form} ({brand_name})"
                else:
                    full_product_name = f"{product.product_name} {product.net_content or ''} per {unit_name} ({brand_name})"

                # Calculate days until expiry
                expiry_date_obj = exp.expiry_date
                days_until_expiry = (expiry_date_obj - now.date()).days

                enriched_data.append({
                    "expiration_id": exp.expiration_id,
                    "expiry_date": str(exp.expiry_date),
                    "days_until_expiry": days_until_expiry,
                    "quantity": exp.quantity,
                    "location_id": location.location_id if location else None,
                    "location": location.location if location else None,
                    "Stock_Item": {
                        "stock_item_id": stock_item.stock_item_id,
                        "quantity": stock_item.quantity,
                        "Product": {
                            "product_id": product.product_id,
                            "full_product_name": full_product_name,
                            "current_price": float(product.current_price),
                            "net_content": product.net_content,
                            "category_id": product.category_id,
                            "brand_id": product.brand_id,
                            "unit_id": product.unit_id,
                        },
                    },
                })

            return Response(enriched_data, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = ExpirationModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @transaction.atomic
    def put(self, request):
        data = request.data
        stock_item_id = data.get("stock_item_id")
        expiration_id = data.get("expiration_id")
        quantity_to_dispose = data.get("quantity")
        disposal_date = data.get("disposal_date")

        if not all([stock_item_id, expiration_id, quantity_to_dispose, disposal_date]):
            return Response({"error": "Missing required fields"}, status=400)

        try:
            quantity_to_dispose = int(quantity_to_dispose)

            # 1. Get current stock quantity and src_location
            try:
                stock_item = StockItem.objects.get(stock_item_id=stock_item_id)
            except StockItem.DoesNotExist:
                return Response({"error": "Stock item not found"}, status=404)

            current_quantity = stock_item.quantity
            src_location = stock_item.location_id

            if quantity_to_dispose > current_quantity:
                return Response({"error": "Disposal quantity exceeds available stock"}, status=400)

            # 2. Get current expiration quantity
            try:
                expiration = ExpirationModel.objects.get(expiration_id=expiration_id)
            except ExpirationModel.DoesNotExist:
                return Response({"error": "Expiration record not found"}, status=404)

            expiration_quantity = expiration.quantity
            if quantity_to_dispose > expiration_quantity:
                return Response({"error": "Disposal quantity exceeds expiration quantity"}, status=400)

            # 3. Insert stock transaction
            StockTransaction.objects.create(
                stock_item_id=stock_item_id,
                transaction_type="Expired Item Disposal",
                quantity_change=-quantity_to_dispose,
                disposed_date=disposal_date,
                src_location=src_location,
            )

            # 4. Update stock item quantity
            stock_item.quantity = current_quantity - quantity_to_dispose
            stock_item.save()

            # 5. Update expiration quantity
            expiration.quantity = expiration_quantity - quantity_to_dispose
            expiration.save()

            return Response({"message": "Disposal recorded and quantities updated"}, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def delete(self, request, expiration_id):
        try:
            deleted, _ = ExpirationModel.objects.filter(expiration_id=expiration_id).delete()
            if deleted:
                return Response({"message": "Expiration deleted successfully"}, status=204)
            return Response({"error": "Expiration not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
