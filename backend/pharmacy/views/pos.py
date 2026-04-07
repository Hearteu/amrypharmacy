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
                    "shift_id": getattr(pos, 'shift_id', None),
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
            order_type = data.get("customerType", "regular")

            # Generate invoice number
            now = datetime.now()
            count = POSModel.objects.count() + 1
            invoice = f"INV-{now.strftime('%Y%m%d')}-{count:04d}"

            prescription_id = None

            # Handle customer types that need prescriptions
            customer_type = data.get("customerType")
            
            customer_info = data.get("customerInfo", {})
            prescription_info = data.get("prescriptionInfo", {})
            discount_info = data.get("discountInfo", {})

            if customer_type and customer_type.lower() in ["dswd", "senior citizen", "pwd", "discount"]:
                # Create or get Person
                # The frontend mixes patient info in customerInfo or discountInfo
                patient_name = customer_info.get("patient_name") or discount_info.get("name") or "Unknown"
                name_parts = patient_name.split(" ", 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ""
                
                person_data = {
                    "first_name": first_name,
                    "last_name": last_name,
                    "contact": customer_info.get("invoiceNumber") or "", # using invoiceNumber as contact in frontend form?
                    "address": discount_info.get("address") or "",
                }
                person = Person.objects.create(**{k: v for k, v in person_data.items() if v})

                # Determine Customer Type ID (naive match, assuming defaults exist)
                ctype_id = 1
                if customer_type.lower() == "dswd":
                    ctype_id = 2  # Example ID
                elif customer_type.lower() in ["pwd", "senior citizen", "discount"]:
                    ctype_id = 3

                # Create or get Customer
                customer = Customer.objects.create(
                    person_id=person.person_id,
                    customer_type_id=ctype_id,
                    id_card_number=discount_info.get("idNumber") or "",
                )

                # Create Physician if provided
                physician_id = None
                doctor_name = prescription_info.get("doctorName")
                if doctor_name:
                    doc_parts = doctor_name.split(" ", 1)
                    physician_person = Person.objects.create(
                        first_name=doc_parts[0],
                        last_name=doc_parts[1] if len(doc_parts) > 1 else "",
                    )
                    physician = Physician.objects.create(
                        person_id=physician_person.person_id,
                        prc_num=prescription_info.get("PRCNumber"),
                        ptr_num=prescription_info.get("PTRNumber"),
                    )
                    physician_id = physician.physician_id

                # Create Prescription if details exist
                if doctor_name or prescription_info.get("prescriptionDate"):
                    # Use a fallback empty string if prescription_details is needed but not provided
                    prescription = Prescription.objects.create(
                        customer_id=customer.customer_id,
                        physician_id=physician_id,
                        prescription_details=prescription_info.get("notes") or "",
                        date_issued=prescription_info.get("prescriptionDate") or now.date(),
                    )
                    prescription_id = prescription.prescription_id

                # Create DSWD Order if applicable
                if customer_type.lower() == "dswd":
                    date_val = customer_info.get("guaranteeLetterDate") or customer_info.get("receivedDate")
                    gl_date_str = date_val[:10] if date_val else now.date() # Frontend sends ISO Strings
                    claim_date_str = customer_info.get("receivedDate", "")[:10] if customer_info.get("receivedDate") else now.date()
                    
                    DswdOrder.objects.create(
                        customer_id=customer.customer_id,
                        gl_num=customer_info.get("guaranteeLetterNo"),
                        gl_date=gl_date_str,
                        claim_date=claim_date_str,
                        client_name=customer_info.get("client_name"),
                    )

            # Find an active open shift for this user
            from ..models import CashShift
            active_shift = CashShift.objects.filter(user_id=data.get("user_id"), status='OPEN').first()
            shift_id = active_shift.shift_id if active_shift else None

            # Create POS record
            pos = POSModel.objects.create(
                sale_date=now,
                invoice=invoice,
                user_id=data.get("user_id"),
                order_type=order_type,
                prescription_id=prescription_id,
                payment_method=data.get("paymentMethod", "Cash"),
                payment_amount=data.get("paymentAmount", 0),
                shift_id=shift_id,
            )

            # Process each item
            for item in items:
                product_id = item["product_id"]
                quantity_sold = int(item.get("quantity", item.get("quantity_sold", 0)))
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
