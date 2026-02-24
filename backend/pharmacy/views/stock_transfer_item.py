import traceback
from datetime import datetime, timezone

from django.db import transaction
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Location, StockItem, StockTransaction,
                       StockTransferItem as StockTransferItemModel,
                       SupplierItem)


class STI(APIView):
    def get(self, request, stock_transfer_item_id=None):
        """Retrieve a specific Stock Transfer Item or all items"""
        try:
            if stock_transfer_item_id:
                qs = StockTransferItemModel.objects.filter(stock_transfer_item_id=stock_transfer_item_id)
            else:
                qs = StockTransferItemModel.objects.all()

            if not qs.exists():
                return Response({"error": "No Stock Transfer Items found"}, status=404)

            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @transaction.atomic
    def put(self, request, stock_transfer_item_id=None):
        """Update a Stock Transfer Item, insert stock transaction, and update stock item"""
        try:
            data = request.data

            status = data.get("purchase_order_item_status_id", 1)
            to_receive = data.get("received_qty", 0)
            expired_qty = data.get("expired_qty", 0)
            damaged_qty = data.get("damaged_qty", 0)
            expiry_date = data.get("expiry_date", None)

            if expiry_date:
                expiry_date = datetime.fromisoformat(expiry_date).strftime("%Y-%m-%d")

            # Step 1: Get product_id and ordered_qty
            try:
                sti = StockTransferItemModel.objects.get(
                    stock_transfer_item_id=stock_transfer_item_id
                )
            except StockTransferItemModel.DoesNotExist:
                return Response({"error": "Stock Transfer Item not found"}, status=404)

            # The original code joins through Supplier_Item to get product_id
            # This view appears to reference supplier_item_id which might not exist on STI model
            # Falling back to using product_id directly from STI
            product_id = sti.product_id
            ordered_qty = sti.ordered_quantity

            # Step 2: Get stock_item_id
            try:
                stock_item = StockItem.objects.filter(product_id=product_id).first()
                if not stock_item:
                    return Response({"error": "Stock item not found"}, status=404)
            except Exception:
                return Response({"error": "Stock item not found"}, status=404)

            current_quantity = stock_item.quantity
            new_quantity = current_quantity + to_receive

            # Step 3: Update the Stock_Transfer_Item
            StockTransferItemModel.objects.filter(
                stock_transfer_item_id=stock_transfer_item_id
            ).update(
                transferred_qty=to_receive,
            )

            # Step 4: Validate before inserting stock transaction
            total_qty_handled = to_receive + expired_qty + damaged_qty
            if total_qty_handled == ordered_qty:
                # Step 5: Get Location IDs
                try:
                    src_location = Location.objects.get(location="Supplier")
                    des_location = Location.objects.get(location="Asuncion - Stockroom")
                except Location.DoesNotExist:
                    return Response({"error": "One or more locations not found"}, status=404)

                # Step 6: Insert Stock Transaction
                StockTransaction.objects.create(
                    stock_item_id=stock_item.stock_item_id,
                    transaction_type="POI",
                    reference_id=stock_transfer_item_id,
                    src_location=src_location.location_id,
                    des_location=des_location.location_id,
                    quantity_change=to_receive,
                    transaction_date=datetime.now(timezone.utc),
                )

                # Step 7: Update Stock_Item quantity
                stock_item.quantity = new_quantity
                stock_item.save()

            return Response({"message": "Purchase Order Item updated successfully"}, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def delete(self, request, stock_transfer_item_id):
        try:
            deleted, _ = StockTransferItemModel.objects.filter(
                stock_transfer_item_id=stock_transfer_item_id
            ).delete()
            if deleted:
                return Response({"message": "Stock_Transfer_Item deleted successfully"}, status=204)
            return Response({"error": "Stock_Transfer_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)