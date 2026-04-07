import traceback
from datetime import datetime

from django.db import transaction
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (PurchaseOrder as PurchaseOrderModel, PurchaseOrderItem,
                       PurchaseOrderStatus, SupplierItem)


class PurchaseOrder(APIView):
    def get(self, request, purchase_order_id=None):
        try:
            qs = PurchaseOrderModel.objects.select_related('purchase_order_status')

            if purchase_order_id is not None:
                qs = qs.filter(purchase_order_id=purchase_order_id)

            if not qs.exists():
                return Response({"error": "No purchase orders found"}, status=404)

            result = []
            for po in qs:
                # Get line items with supplier item details
                items = PurchaseOrderItem.objects.select_related(
                    'supplier_item', 'supplier_item__product',
                    'supplier_item__product__drug',
                    'supplier_item__supplier',
                    'unit', 'purchase_order_item_status'
                ).filter(purchase_order_id=po.purchase_order_id)

                items_data = []
                po_total = 0
                supplier_data = None

                for item in items:
                    si = item.supplier_item
                    product = si.product if si else None
                    drug = getattr(product, 'drug', None) if product else None
                    
                    price = float(si.supplier_price) if si else 0
                    ordered = item.ordered_qty or 0
                    poi_total = price * ordered
                    po_total += poi_total

                    if si and si.supplier and not supplier_data:
                        supplier_data = {
                            "name": si.supplier.supplier_name,
                            "contact": si.supplier.person.contact if si.supplier.person else None,
                            "email": si.supplier.person.email if si.supplier.person else None,
                            "phone": si.supplier.person.contact if si.supplier.person else None,
                            "address": si.supplier.person.address if si.supplier.person else None,
                        }

                    items_data.append({
                        "purchase_order_item_id": item.purchase_order_item_id,
                        "poi_id": item.poi_id,
                        "description": product.product_name if product else "Unknown Product",
                        "ordered_qty": item.ordered_qty,
                        "received_qty": item.received_qty,
                        "expired_qty": item.expired_qty,
                        "damaged_qty": item.damaged_qty,
                        "expiry_date": str(item.expiry_date) if item.expiry_date else None,
                        "unit_id": item.unit_id,
                        "Unit": {"unit": item.unit.unit} if item.unit else None,
                        "purchase_order_item_status": item.purchase_order_item_status_id,
                        "po_item_status": item.purchase_order_item_status.po_item_status if item.purchase_order_item_status else "Pending",
                        "supplier_price": price,
                        "poi_total": poi_total,
                        "supplier_item_id": item.supplier_item_id,
                        "Supplier_Item": {
                            "supplier_item_id": si.supplier_item_id,
                            "supplier_price": price,
                            "product_id": si.product_id,
                            "Supplier": {
                                "supplier_id": si.supplier_id,
                                "supplier_name": si.supplier.supplier_name if si.supplier else None,
                            } if si.supplier else None,
                            "Products": {
                                "product_id": product.product_id,
                                "product_name": product.product_name,
                                "Drugs": {
                                    "dosage_strength": drug.dosage_strength,
                                    "dosage_form": drug.dosage_form,
                                } if drug else None,
                            } if product else None,
                        } if si else None,
                    })

                # Check for order delay
                expected = po.expected_delivery_date
                is_delayed = False
                if expected and datetime.now().date() > expected:
                    is_delayed = True

                result.append({
                    "purchase_order_id": po.purchase_order_id,
                    "po_id": po.po_id,
                    "supplier": supplier_data,
                    "order_date": str(po.order_date) if po.order_date else None,
                    "expected_date": str(po.expected_delivery_date) if po.expected_delivery_date else None,
                    "status_id": po.purchase_order_status_id,
                    "status": po.purchase_order_status.purchase_order_status if po.purchase_order_status else "Draft",
                    "purchase_order_status_id": po.purchase_order_status_id,
                    "notes": po.notes,
                    "po_total": po_total,
                    "is_delayed": is_delayed,
                    "lineItems": items_data,
                })

            if purchase_order_id is not None and result:
                return Response(result[0], status=200)

            return Response(result, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @transaction.atomic
    def post(self, request):
        data = request.data
        try:
            items = data.get("items", [])

            # Generate PO ID
            now = datetime.now()
            count = PurchaseOrderModel.objects.count() + 1
            po_id = f"PO-{now.strftime('%Y')}-{count:03d}"

            po = PurchaseOrderModel.objects.create(
                po_id=po_id,
                order_date=data.get("order_date", now.date()),
                expected_delivery_date=data.get("expected_delivery_date"),
                purchase_order_status_id=data.get("purchase_order_status_id", 1),
                notes=data.get("notes"),
            )

            # Insert line items
            for i, item in enumerate(items, 1):
                poi_id = f"POI-{count:03d}-{i:02d}"
                PurchaseOrderItem.objects.create(
                    poi_id=poi_id,
                    purchase_order_id=po.purchase_order_id,
                    supplier_item_id=item.get("supplier_item_id"),
                    ordered_qty=item.get("ordered_qty", 0),
                    received_qty=item.get("received_qty", 0),
                    expired_qty=item.get("expired_qty", 0),
                    damaged_qty=item.get("damaged_qty", 0),
                    expiry_date=item.get("expiry_date"),
                    unit_id=item.get("unit_id"),
                    purchase_order_item_status_id=item.get("purchase_order_item_status_id", 1),
                )

            return Response({
                "purchase_order_id": po.purchase_order_id,
                "po_id": po.po_id,
                "message": "Purchase order created successfully",
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    @transaction.atomic
    def put(self, request, purchase_order_id):
        data = request.data
        try:
            try:
                po = PurchaseOrderModel.objects.get(purchase_order_id=purchase_order_id)
            except PurchaseOrderModel.DoesNotExist:
                return Response({"error": "Purchase order not found"}, status=404)

            # Update PO fields
            po_fields = ["order_date", "expected_delivery_date", "purchase_order_status_id", "notes"]
            po_data = {k: v for k, v in data.items() if k in po_fields and v is not None}
            if po_data:
                PurchaseOrderModel.objects.filter(purchase_order_id=purchase_order_id).update(**po_data)

            # Handle line items update
            items = data.get("items")
            if items is not None:
                existing_ids = set(
                    PurchaseOrderItem.objects.filter(purchase_order_id=purchase_order_id)
                    .values_list('purchase_order_item_id', flat=True)
                )
                incoming_ids = set()

                for item in items:
                    item_id = item.get("purchase_order_item_id")
                    if item_id:
                        incoming_ids.add(item_id)
                        # Update existing item
                        update_fields = {k: v for k, v in item.items() if k != "purchase_order_item_id" and v is not None}
                        PurchaseOrderItem.objects.filter(purchase_order_item_id=item_id).update(**update_fields)
                    else:
                        # Add new item
                        PurchaseOrderItem.objects.create(
                            purchase_order_id=purchase_order_id,
                            supplier_item_id=item.get("supplier_item_id"),
                            ordered_qty=item.get("ordered_qty", 0),
                            received_qty=item.get("received_qty", 0),
                            unit_id=item.get("unit_id"),
                            purchase_order_item_status_id=item.get("purchase_order_item_status_id", 1),
                        )

                # Delete removed items
                to_delete = existing_ids - incoming_ids
                if to_delete:
                    PurchaseOrderItem.objects.filter(purchase_order_item_id__in=to_delete).delete()

            return Response({"message": "Purchase order updated successfully"}, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    def delete(self, request, purchase_order_id):
        try:
            deleted, _ = PurchaseOrderModel.objects.filter(purchase_order_id=purchase_order_id).delete()
            if deleted:
                return Response({"message": "Purchase order deleted successfully"}, status=204)
            return Response({"error": "Purchase order not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
