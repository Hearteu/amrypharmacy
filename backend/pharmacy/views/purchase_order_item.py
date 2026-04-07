import traceback
from datetime import datetime

from django.db import transaction
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Expiration, Location, PurchaseOrderItem,
                       StockItem, StockTransaction, SupplierItem)


class POI(APIView):
    def get(self, request, purchase_order_item_id=None):
        """Retrieve a specific Purchase Order Item or all items"""
        try:
            if purchase_order_item_id:
                qs = PurchaseOrderItem.objects.filter(purchase_order_item_id=purchase_order_item_id)
            else:
                qs = PurchaseOrderItem.objects.all()

            if not qs.exists():
                return Response({"error": "No Purchase Order Items found"}, status=404)

            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @transaction.atomic
    def put(self, request, purchase_order_item_id=None):
        """Update a Purchase Order Item, insert stock transaction, and update stock item by location"""
        try:
            data = request.data

            status = data.get("purchase_order_item_status_id", 1)
            to_receive = data.get("received_qty", 0)
            expired_qty = data.get("expired_qty", 0)
            damaged_qty = data.get("damaged_qty", 0)
            expiry_date = data.get("expiry_date", None)

            if expiry_date:
                expiry_date = datetime.fromisoformat(expiry_date).strftime("%Y-%m-%d")

            # Step 1: Get product_id and ordered_qty from Purchase_Order_Item
            try:
                poi = PurchaseOrderItem.objects.select_related('supplier_item').get(
                    purchase_order_item_id=purchase_order_item_id
                )
            except PurchaseOrderItem.DoesNotExist:
                return Response({"error": "Purchase Order Item not found"}, status=404)

            product_id = poi.supplier_item.product_id
            ordered_qty = poi.ordered_qty

            # Step 2: Get Location IDs for src and destination
            try:
                src_location = Location.objects.get(location="Supplier")
                des_location = Location.objects.get(location="Asuncion - Stockroom")
            except Location.DoesNotExist:
                return Response({"error": "One or more locations not found"}, status=404)

            src_location_id = src_location.location_id
            des_location_id = des_location.location_id

            # Step 3: Get or create stock_item
            stock_item, created = StockItem.objects.get_or_create(
                product_id=product_id,
                location_id=des_location_id,
                defaults={"quantity": 0},
            )

            current_quantity = stock_item.quantity
            new_quantity = current_quantity + to_receive

            # Step 4: Update the Purchase_Order_Item
            PurchaseOrderItem.objects.filter(
                purchase_order_item_id=purchase_order_item_id
            ).update(
                purchase_order_item_status_id=status,
                received_qty=to_receive,
                expired_qty=expired_qty,
                damaged_qty=damaged_qty,
            )

            # Step 5: Validate before inserting stock transaction
            total_qty_handled = to_receive + expired_qty + damaged_qty
            if total_qty_handled == ordered_qty and status != 1:
                # Step 6: Insert Stock Transaction
                StockTransaction.objects.create(
                    stock_item_id=stock_item.stock_item_id,
                    transaction_type="POI",
                    reference_id=purchase_order_item_id,
                    src_location=src_location_id,
                    des_location=des_location_id,
                    quantity_change=to_receive,
                    transaction_date=timezone.now(),
                )

                # Insert Expiration record if expiry_date provided
                if expiry_date:
                    Expiration.objects.create(
                        stock_item_id=stock_item.stock_item_id,
                        expiry_date=expiry_date,
                        quantity=to_receive,
                    )

                # Step 7: Update Stock_Item quantity
                stock_item.quantity = new_quantity
                stock_item.save()

            return Response({"message": "Purchase Order Item updated successfully"}, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def delete(self, request, purchase_order_item_id):
        try:
            deleted, _ = PurchaseOrderItem.objects.filter(
                purchase_order_item_id=purchase_order_item_id
            ).delete()
            if deleted:
                return Response({"message": "Purchase_Order_Item deleted successfully"}, status=204)
            return Response({"error": "Purchase_Order_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)