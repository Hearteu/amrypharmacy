# views.py

from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class POS(APIView):
    def get(self, request, pos_id=None):
        try:
            order_type = request.query_params.get("order_type")  # e.g., 'DSWD', 'senior citizen'

            # Base POS query
            query = supabase.table('POS').select('*')

            if pos_id is not None:
                query = query.eq('pos_id', pos_id)

            if order_type is not None:
                query = query.ilike('order_type', order_type.lower())

            pos_response = query.execute()

            if not pos_response.data:
                return Response({"error": "No POS records found"}, status=404)

            formatted_pos_data = []

            for pos in pos_response.data:
                items_response = (
                    supabase.table('POS_Item')
                    .select("*, Products(*, Drugs(*))")
                    .eq("pos_id", pos["pos_id"])
                    .execute()
                )

                items = items_response.data if items_response.data else []
                total_amount = 0
                formatted_items = []

                for item in items:
                    product = item.get("Products") or {}
                    drugs = product.get("Drugs") or {}

                    dosage = f"{drugs.get('dosage_form', '')} {drugs.get('dosage_strength', '')}".strip()
                    full_name = f"{product.get('product_name', 'Unknown Product')} {dosage}".strip()

                    item_total = item["quantity_sold"] * item["price"]
                    total_amount += item_total

                    formatted_items.append({
                        "pos_item_id": item["pos_item_id"],
                        "product_id": product.get("product_id", "N/A"),
                        "full_product_name": full_name,
                        "quantity": item["quantity_sold"],
                        "price": item["price"],
                        "total_price": item_total
                    })

                formatted_pos_data.append({
                    "pos_id": pos["pos_id"],
                    "sale_date": pos.get("sale_date"),
                    "user_id": pos.get("user_id"),
                    "invoice": pos.get("invoice"),
                    "order_type": pos.get("order_type"),
                    "total_amount": total_amount,
                    "items": formatted_items
                })

            return Response(formatted_pos_data[0] if pos_id else formatted_pos_data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    def post(self, request):
        """Create a new POS transaction, update stock, and record stock transactions."""
        try:
            data = request.data
            print(f"🟢 Received POS request data: {data}")

            current_year = datetime.now().year

            # Fetch latest pos_id for invoice generation
            latest_pos_query = supabase.table("POS").select("pos_id") \
                .order("pos_id", desc=True).limit(1).execute()

            pos_id = (latest_pos_query.data[0]["pos_id"] + 1) if latest_pos_query.data else 1
            invoice_number = f"POS-{current_year}-{pos_id:03d}"
            transaction_date = datetime.fromisoformat(data["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")

            customer_id = None
            if data["customerType"] != "regular":
                # Split customer name
                name_parts = data["customerInfo"]["name"].split()
                first_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else name_parts[0]
                last_name = name_parts[-1] if len(name_parts) > 1 else ""

                # Check if person exists
                person_query = supabase.table("Person").select("person_id") \
                    .eq("first_name", first_name).eq("last_name", last_name).limit(1).execute()

                person_id = person_query.data[0]["person_id"] if person_query.data else None
                if not person_id:
                    person_insert = supabase.table("Person").insert({
                        "first_name": first_name, "last_name": last_name
                    }).execute()
                    person_id = person_insert.data[0]["person_id"] if person_insert.data else None

                # Check customer type
                customer_type_query = supabase.table("Customer_Type").select("customer_type_id") \
                    .eq("description", data["customerType"]).limit(1).execute()

                if not customer_type_query.data:
                    return Response({"error": "Invalid customer type"}, status=400)

                customer_type_id = customer_type_query.data[0]["customer_type_id"]

                # Insert customer
                customer_insert = supabase.table("Customers").insert({
                    "person_id": person_id, "id_card_number": data["discountInfo"].get("idNumber"),
                    "customer_type_id": customer_type_id
                }).execute()
                customer_id = customer_insert.data[0]["customer_id"] if customer_insert.data else None

            # Insert into POS table
            pos_insert = supabase.table("POS").insert({
                "sale_date": transaction_date, "invoice": invoice_number, "user_id": data["user_id"], "order_type": data["customerType"], "customer_id": customer_id
            }).execute()

            pos_transaction_id = pos_insert.data[0]["pos_id"] if pos_insert.data else None
            print(f"🟢 POS Transaction Created: ID={pos_transaction_id}, Invoice={invoice_number}")

            # Insert Prescription if provided
            if "prescriptionInfo" in data and data["prescriptionInfo"].get("doctorName"):
                prescription = data["prescriptionInfo"]

                # Split doctor name
                doctor_name_parts = prescription["doctorName"].split()
                doctor_first_name = " ".join(doctor_name_parts[:-1]) if len(doctor_name_parts) > 1 else doctor_name_parts[0]
                doctor_last_name = doctor_name_parts[-1] if len(doctor_name_parts) > 1 else ""

                # Check if physician exists
                physician_query = supabase.table("Physician").select("physician_id", "person_id") \
                    .eq("prc_num", prescription["PRCNumber"]).eq("ptr_num", prescription["PTRNumber"]).limit(1).execute()

                physician_id = physician_query.data[0]["physician_id"] if physician_query.data else None

                if not physician_id:
                    # Check if person exists for physician
                    person_query = supabase.table("Person").select("person_id") \
                        .eq("first_name", doctor_first_name).eq("last_name", doctor_last_name).limit(1).execute()

                    physician_person_id = person_query.data[0]["person_id"] if person_query.data else None
                    if not physician_person_id:
                        person_insert = supabase.table("Person").insert({
                            "first_name": doctor_first_name, "last_name": doctor_last_name
                        }).execute()
                        physician_person_id = person_insert.data[0]["person_id"] if person_insert.data else None

                    # Insert physician
                    physician_insert = supabase.table("Physician").insert({
                        "person_id": physician_person_id, "prc_num": prescription["PRCNumber"],
                        "ptr_num": prescription["PTRNumber"]
                    }).execute()
                    physician_id = physician_insert.data[0]["physician_id"] if physician_insert.data else None

                # Insert prescription
                prescription_insert = supabase.table("Prescription").insert({
                    "customer_id": customer_id, "physician_id": physician_id,
                    "prescription_details": prescription.get("notes", ""),
                    "date_issued": prescription["prescriptionDate"]
                }).execute()
                print(f"🟢 Prescription added for POS ID: {pos_transaction_id}")

            # Insert into POS_Item and update Stock_Item
            for item in data["items"]:
                # Fetch stock item (location-specific)
                stock_item_query = supabase.table("Stock_Item").select("stock_item_id") \
                    .eq("product_id", item["product_id"]).eq("location_id", data["branch"]).limit(1).execute()

                if not stock_item_query.data:
                    print(f"⚠️ Stock item not found for product {item['product_id']} at location {data['branch']}")
                    continue  # Skip item

                stock_item_id = stock_item_query.data[0]["stock_item_id"]

                # Deduct stock item quantity
                current_quantity_query = supabase.table("Stock_Item").select("quantity") \
                    .eq("stock_item_id", stock_item_id).limit(1).execute()

                if not current_quantity_query.data:
                    print(f"⚠️ Failed to fetch current quantity for stock item {stock_item_id}")
                    continue  # Skip item

                current_quantity = current_quantity_query.data[0]["quantity"]
                new_quantity = current_quantity - item["quantity"]

                # Update Stock_Item quantity
                stock_item_update = supabase.table("Stock_Item").update({
                    "quantity": new_quantity
                }).eq("stock_item_id", stock_item_id).execute()

                if not stock_item_update.data:
                    print(f"⚠️ Failed to update stock item {stock_item_id} for product {item['product_id']}")
                    continue  # Skip item

                print(f"🟢 Stock item {stock_item_id} updated for product {item['product_id']} with new quantity {new_quantity}")

                # Insert stock transaction log (general deduction, outside FIFO logic)
                supabase.table("Stock_Transaction").insert({
                    "transaction_date": transaction_date,
                    "transaction_type": "POS",
                    "src_location": data["branch"],
                    "des_location": None,
                    "stock_item_id": stock_item_id,
                    "reference_id": pos_transaction_id,
                    "quantity_change": -item["quantity"],
                    "expiry_date": None  # This will be handled in FIFO logic separately
                }).execute()

                # Handle FIFO expiration tracking
                expiry_query = (
                    supabase.table("Expiration")
                    .select("expiration_id, expiry_date, quantity")
                    .eq("stock_item_id", stock_item_id)
                    .gt("quantity", 0)  # Ignore fully used stock
                    .order("expiry_date", desc=False)  # FIFO order
                    .execute()
                )

                remaining_qty = item["quantity"]

                for batch in expiry_query.data:
                    batch_id = batch["expiration_id"]
                    available_qty = batch["quantity"]

                    if remaining_qty <= 0:
                        break  # Stop if order is fulfilled

                    if available_qty >= remaining_qty:
                        # Deduct from this batch only
                        new_qty = available_qty - remaining_qty
                        remaining_qty = 0
                    else:
                        # Use full batch and move to next
                        new_qty = 0
                        remaining_qty -= available_qty

                    # Update batch quantity
                    supabase.table("Expiration").update({"quantity": new_qty}).eq("expiration_id", batch_id).execute()

                    # Log stock transaction for this batch (FIFO tracking)
                    supabase.table("Stock_Transaction").insert({
                        "transaction_date": transaction_date,
                        "transaction_type": "POS",
                        "src_location": data["branch"],
                        "des_location": None,
                        "stock_item_id": stock_item_id,
                        "reference_id": pos_transaction_id,
                        "quantity_change": -min(item["quantity"], available_qty),
                        "expiry_date": batch["expiry_date"]
                    }).execute()


                # Insert into POS_Item (even if stock is insufficient, for tracking)
                supabase.table("POS_Item").insert({
                    "pos_id": pos_transaction_id, "product_id": item["product_id"],
                    "price": item["price"], "quantity_sold": item["quantity"]
                }).execute()


            print(f"🟢 Successfully inserted {len(data['items'])} items into POS_Item.")

            # Insert into DSWD_Order if applicable
            if data["customerType"] == "dswd":
                supabase.table("DSWD_Order").insert({
                    "patient_id": customer_id, "gl_num": data["customerInfo"].get("guaranteeLetterNo"),
                    "gl_date": data["customerInfo"].get("guaranteeLetterDate"),
                    "claim_date": data["customerInfo"].get("receivedDate")
                }).execute()
                print(f"🟢 DSWD Order added for patient ID: {customer_id}")

            return Response({"message": "POS transaction created successfully", "pos_id": pos_transaction_id}, status=201)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            return Response({"error": str(e)}, status=500)

    
    def delete(self, request, pos_id):
        try:
            response = supabase.table("POS").delete().eq('pos_id', pos_id).execute()

            if response.data:
                return Response({"message": "POS deleted successfully"}, status=204)
            else:
                return Response({"error": "POS not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
