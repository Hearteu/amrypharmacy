import traceback
from collections import defaultdict
from datetime import datetime

from django.db import transaction
from django.db.models import F, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Customer, CustomerType as CustomerTypeModel,
                       Drug, DswdOrder, Expiration, Location, Person,
                       Physician, POS as POSModel, POSItem, Prescription,
                       StockItem, StockTransaction)


class POS(APIView):
    def get(self, request):
        try:
            pos_id = request.GET.get('pos_id')
            branch = request.GET.get('branch')

            pos_qs = POSModel.objects.select_related('user', 'prescription')

            if pos_id:
                pos_qs = pos_qs.filter(pos_id=int(pos_id))

            if not pos_qs.exists():
                return Response({"error": "No POS records found"}, status=404)

            result = []
            for pos in pos_qs:
                # Get POS Items
                items = POSItem.objects.select_related('product').filter(pos_id=pos.pos_id)

                items_data = []
                total_amount = 0
                for item in items:
                    item_total = float(item.price) * item.quantity_sold
                    total_amount += item_total

                    # Get drug info
                    drug = getattr(item.product, 'drug', None)
                    drug_info = None
                    if drug:
                        drug_info = {
                            "dosage_strength": drug.dosage_strength,
                            "dosage_form": drug.dosage_form,
                        }

                    items_data.append({
                        "pos_item_id": item.pos_item_id,
                        "product_id": item.product_id,
                        "product_name": item.product.product_name if item.product else None,
                        "Drugs": drug_info,
                        "price": float(item.price),
                        "quantity_sold": item.quantity_sold,
                        "total_price": item_total,
                    })

                result.append({
                    "pos_id": pos.pos_id,
                    "sale_date": str(pos.sale_date) if pos.sale_date else None,
                    "invoice": pos.invoice,
                    "order_type": pos.order_type,
                    "user_id": pos.user_id,
                    "prescription_id": pos.prescription_id,
                    "POS_Item": items_data,
                    "total_amount": total_amount,
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
            branch = data.get("branch")
            order_type = data.get("order_type", "regular")

            # Generate invoice number
            now = datetime.now()
            count = POSModel.objects.count() + 1
            invoice = f"INV-{now.strftime('%Y%m%d')}-{count:04d}"

            prescription_id = None

            # Handle customer types that need prescriptions
            customer_type = data.get("customer_type")
            if customer_type and customer_type.lower() in ["dswd", "senior citizen", "pwd"]:
                # Create or get Person
                person_data = {
                    "first_name": data.get("first_name"),
                    "last_name": data.get("last_name"),
                    "contact": data.get("contact"),
                }
                person = Person.objects.create(**{k: v for k, v in person_data.items() if v})

                # Create or get Customer
                customer = Customer.objects.create(
                    person_id=person.person_id,
                    customer_type_id=data.get("customer_type_id"),
                    id_card_number=data.get("id_card_number"),
                )

                # Create Physician if provided
                physician_id = None
                if data.get("physician_first_name"):
                    physician_person = Person.objects.create(
                        first_name=data.get("physician_first_name"),
                        last_name=data.get("physician_last_name"),
                    )
                    physician = Physician.objects.create(
                        person_id=physician_person.person_id,
                        prc_num=data.get("prc_num"),
                        ptr_num=data.get("ptr_num"),
                    )
                    physician_id = physician.physician_id

                # Create Prescription
                prescription = Prescription.objects.create(
                    customer_id=customer.customer_id,
                    physician_id=physician_id,
                    prescription_details=data.get("prescription_details"),
                    date_issued=data.get("date_issued"),
                )
                prescription_id = prescription.prescription_id

                # Create DSWD Order if applicable
                if customer_type.lower() == "dswd":
                    DswdOrder.objects.create(
                        customer_id=customer.customer_id,
                        gl_num=data.get("gl_num"),
                        gl_date=data.get("gl_date"),
                        claim_date=data.get("claim_date"),
                        client_name=data.get("client_name"),
                    )

            # Create POS record
            pos = POSModel.objects.create(
                sale_date=now,
                invoice=invoice,
                user_id=data.get("user_id"),
                order_type=order_type,
                prescription_id=prescription_id,
            )

            # Process each item
            for item in items:
                product_id = item["product_id"]
                quantity_sold = int(item["quantity_sold"])
                price = float(item["price"])

                # Insert POS Item
                POSItem.objects.create(
                    pos_id=pos.pos_id,
                    product_id=product_id,
                    price=price,
                    quantity_sold=quantity_sold,
                )

                # Deduct from stock
                try:
                    stock_item = StockItem.objects.get(
                        product_id=product_id,
                        location_id=int(branch),
                    )
                except StockItem.DoesNotExist:
                    continue

                current_qty = stock_item.quantity
                new_qty = current_qty - quantity_sold
                stock_item.quantity = new_qty
                stock_item.save()

                # FIFO expiration deduction
                remaining = quantity_sold
                expirations = Expiration.objects.filter(
                    stock_item_id=stock_item.stock_item_id,
                    quantity__gt=0,
                ).order_by('expiry_date')

                for exp in expirations:
                    if remaining <= 0:
                        break
                    if exp.quantity >= remaining:
                        exp.quantity -= remaining
                        exp.save()
                        remaining = 0
                    else:
                        remaining -= exp.quantity
                        exp.quantity = 0
                        exp.save()

                # Log stock transaction
                StockTransaction.objects.create(
                    stock_item_id=stock_item.stock_item_id,
                    transaction_type="POS",
                    reference_id=pos.pos_id,
                    src_location=int(branch),
                    quantity_change=-quantity_sold,
                    transaction_date=now,
                )

            return Response({
                "pos_id": pos.pos_id,
                "invoice": pos.invoice,
                "message": "POS transaction created successfully",
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    def put(self, request, pos_id):
        data = request.data
        try:
            updated = POSModel.objects.filter(pos_id=pos_id).update(**data)
            if updated:
                pos = POSModel.objects.get(pos_id=pos_id)
                return Response({
                    "pos_id": pos.pos_id,
                    "invoice": pos.invoice,
                }, status=200)
            return Response({"error": "POS not found"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, pos_id):
        try:
            deleted, _ = POSModel.objects.filter(pos_id=pos_id).delete()
            if deleted:
                return Response({"message": "POS deleted successfully"}, status=204)
            return Response({"error": "POS not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
