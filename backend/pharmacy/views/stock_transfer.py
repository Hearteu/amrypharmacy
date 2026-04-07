import traceback
from datetime import datetime

from django.db import transaction
from django.db.models import Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Drug, Expiration, Location, Product,
                       StockItem, StockTransaction,
                       StockTransfer as StockTransferModel,
                       StockTransferItem, StockTransferStatus, Unit)


class StockTransfer(APIView):
    def get(self, request, stock_transfer_id=None):
        try:
            qs = StockTransferModel.objects.select_related(
                'stock_transfer_status', 'src_location', 'des_location'
            )

            src_location = request.GET.get('src_location')
            des_location = request.GET.get('des_location')

            if stock_transfer_id:
                qs = qs.filter(stock_transfer_id=stock_transfer_id)
            if src_location:
                qs = qs.filter(src_location_id=int(src_location))
            if des_location:
                qs = qs.filter(des_location_id=int(des_location))

            if not qs.exists():
                return Response({"error": "No stock transfers found"}, status=404)

            result = []
            for st in qs:
                items = StockTransferItem.objects.select_related(
                    'product', 'product__drug', 'unit', 'stock_transfer_item_status'
                ).filter(stock_transfer_id=st.stock_transfer_id)

                items_data = []
                for item in items:
                    product = item.product
                    drug = getattr(product, 'drug', None) if product else None

                    # Get current stock quantity from source location in Expiration table
                    stock_items_src = StockItem.objects.filter(
                        product_id=item.product_id,
                        location_id=st.src_location_id
                    )
                    current_stock = 0
                    for si in stock_items_src:
                        exp_sum = Expiration.objects.filter(
                            stock_item_id=si.stock_item_id,
                            quantity__gt=0
                        ).aggregate(total=Sum('quantity'))['total'] or 0
                        current_stock += si.quantity

                    items_data.append({
                        "stock_transfer_item_id": item.stock_transfer_item_id,
                        "sti_id": item.sti_id,
                        "ordered_quantity": item.ordered_quantity,
                        "transferred_qty": item.transferred_qty,
                        "product_id": item.product_id,
                        "unit_id": item.unit_id,
                        "Unit": {"unit": item.unit.unit} if item.unit else None,
                        "stock_transfer_item_status_id": item.stock_transfer_item_status_id,
                        "Stock_Transfer_Item_Status": {
                            "stock_transfer_item_status": item.stock_transfer_item_status.stock_transfer_item_status
                        } if item.stock_transfer_item_status else None,
                        "Products": {
                            "product_id": product.product_id,
                            "product_name": product.product_name,
                            "Drugs": {
                                "dosage_strength": drug.dosage_strength,
                                "dosage_form": drug.dosage_form,
                            } if drug else None,
                        } if product else None,
                        "current_stock": current_stock,
                    })

                result.append({
                    "stock_transfer_id": st.stock_transfer_id,
                    "transfer_id": st.transfer_id,
                    "transfer_date": str(st.transfer_date) if st.transfer_date else None,
                    "stock_transfer_status_id": st.stock_transfer_status_id,
                    "status_id": st.stock_transfer_status_id,
                    "status": st.stock_transfer_status.stock_transfer_status if st.stock_transfer_status else "Draft",
                    "Stock_Transfer_Status": {
                        "stock_transfer_status": st.stock_transfer_status.stock_transfer_status
                    } if st.stock_transfer_status else None,
                    "src_location": st.src_location_id,
                    "src_location_name": st.src_location.location if st.src_location else None,
                    "src_location_data": {
                        "location": st.src_location.location
                    } if st.src_location else None,
                    "des_location": st.des_location_id,
                    "des_location_name": st.des_location.location if st.des_location else None,
                    "des_location_data": {
                        "location": st.des_location.location
                    } if st.des_location else None,
                    "Stock_Transfer_Item": items_data,
                })

            return Response(result, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @transaction.atomic
    def post(self, request):
        data = request.data
        try:
            items = data.get("items", [])

            # Generate transfer ID
            now = datetime.now()
            count = StockTransferModel.objects.count() + 1
            transfer_id = f"ST-{now.strftime('%Y')}-{count:03d}"

            st = StockTransferModel.objects.create(
                transfer_id=transfer_id,
                transfer_date=data.get("transfer_date", now.date()),
                stock_transfer_status_id=data.get("stock_transfer_status_id", 1),
                src_location_id=data.get("src_location"),
                des_location_id=data.get("des_location"),
            )

            for i, item in enumerate(items, 1):
                sti_id = f"STI-{count:03d}-{i:02d}"
                StockTransferItem.objects.create(
                    sti_id=sti_id,
                    stock_transfer_id=st.stock_transfer_id,
                    product_id=item.get("product_id"),
                    ordered_quantity=item.get("ordered_quantity", 0),
                    transferred_qty=item.get("transferred_qty", 0),
                    unit_id=item.get("unit_id"),
                    stock_transfer_item_status_id=item.get("stock_transfer_item_status_id", 1),
                )

            return Response({
                "stock_transfer_id": st.stock_transfer_id,
                "transfer_id": st.transfer_id,
                "message": "Stock transfer created successfully",
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    @transaction.atomic
    def put(self, request, stock_transfer_id):
        data = request.data
        try:
            try:
                st = StockTransferModel.objects.get(stock_transfer_id=stock_transfer_id)
            except StockTransferModel.DoesNotExist:
                return Response({"error": "Stock transfer not found"}, status=404)

            new_status_id = data.get("stock_transfer_status_id")

            # If status is being set to Completed (4)
            if new_status_id == 4:
                items = StockTransferItem.objects.filter(stock_transfer_id=stock_transfer_id)
                src_location_id = st.src_location_id
                des_location_id = st.des_location_id

                for item in items:
                    product_id = item.product_id
                    transferred_qty = item.transferred_qty or item.ordered_quantity

                    # Update source stock (deduct)
                    try:
                        src_stock = StockItem.objects.get(
                            product_id=product_id, location_id=src_location_id
                        )
                        src_stock.quantity -= transferred_qty
                        src_stock.save()
                    except StockItem.DoesNotExist:
                        pass

                    # Update destination stock (add)
                    des_stock, created = StockItem.objects.get_or_create(
                        product_id=product_id, location_id=des_location_id,
                        defaults={"quantity": 0},
                    )
                    des_stock.quantity += transferred_qty
                    des_stock.save()

                    # Log stock transaction
                    StockTransaction.objects.create(
                        stock_item_id=des_stock.stock_item_id,
                        transaction_type="Stock_Transfer",
                        reference_id=stock_transfer_id,
                        src_location=src_location_id,
                        des_location=des_location_id,
                        quantity_change=transferred_qty,
                        transaction_date=datetime.now(),
                    )

                    # Update item status to completed
                    item.stock_transfer_item_status_id = 4
                    item.save()

            # Update the transfer status
            update_fields = {}
            if new_status_id is not None:
                update_fields["stock_transfer_status_id"] = new_status_id
            if data.get("transfer_date"):
                update_fields["transfer_date"] = data["transfer_date"]

            if update_fields:
                StockTransferModel.objects.filter(stock_transfer_id=stock_transfer_id).update(**update_fields)

            return Response({"message": "Stock transfer updated successfully"}, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    def delete(self, request, stock_transfer_id):
        try:
            deleted, _ = StockTransferModel.objects.filter(stock_transfer_id=stock_transfer_id).delete()
            if deleted:
                return Response({"message": "Stock transfer deleted successfully"}, status=204)
            return Response({"error": "Stock transfer not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
