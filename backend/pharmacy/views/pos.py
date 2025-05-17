# views.py

import traceback
from calendar import month_name
from collections import defaultdict
from datetime import date, datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

def safe_date(value):
    return value.isoformat() if isinstance(value, (date, datetime)) else value

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class POS(APIView):
    def get(self, request):
        try:
            # Optional month filtering
            month_param = request.query_params.get('month', '').strip().lower()
            month_lookup = {name.lower(): i for i, name in enumerate(month_name) if name}
            month_number = month_lookup.get(month_param) if month_param else None

            # Load Stock_Transaction data
            stock_transactions = supabase.table('Stock_Transaction').select('*').ilike('transaction_type', 'pos').execute()
            transactions = stock_transactions.data or []

            if not transactions:
                return Response({"error": "No POS transactions found"}, status=404)

            # POS and related data
            pos_ids = list({txn['reference_id'] for txn in transactions if txn.get('reference_id')})
            pos_list = supabase.table('POS').select('*').in_('pos_id', pos_ids).execute().data
            pos_map = {pos['pos_id']: pos for pos in pos_list}

            pos_items = supabase.table('POS_Item').select('*').in_('pos_id', pos_ids).execute().data
            pos_items_by_pos = defaultdict(list)
            for item in pos_items:
                total_price = item["quantity_sold"] * item["price"]
                item["total_price"] = total_price
                pos_items_by_pos[item['pos_id']].append(item)

            prescription_ids = [pos['prescription_id'] for pos in pos_list if pos.get('prescription_id')]
            prescriptions = supabase.table('Prescription').select('*').in_('prescription_id', prescription_ids).execute().data
            prescription_map = {p['prescription_id']: p for p in prescriptions}

            customer_ids = [p['customer_id'] for p in prescriptions if p.get('customer_id')]
            customers = supabase.table('Customers').select('*').in_('customer_id', customer_ids).execute().data
            customer_map = {c['customer_id']: c for c in customers}

            customer_type_ids = [c['customer_type_id'] for c in customers if c.get('customer_type_id')]
            customer_types = supabase.table('Customer_Type').select('*').in_('customer_type_id', customer_type_ids).execute().data
            customer_type_map = {ct['customer_type_id']: ct for ct in customer_types}

            # Organize monthly -> daily sales
            monthly_sales = defaultdict(lambda: defaultdict(lambda: {
                "Asuncion": 0.0,
                "Talaingod": 0.0,
                "regular_sales": 0.0,
                "total_dswd": 0.0
            }))

            for txn in transactions:
                pos = pos_map.get(txn['reference_id'])
                if not pos:
                    continue

                txn_date_str = txn.get('transaction_date')
                if not txn_date_str:
                    continue

                txn_date = datetime.fromisoformat(txn_date_str.replace('Z', '+00:00'))
                if month_number and txn_date.month != month_number:
                    continue

                date_key = txn_date.strftime('%m/%d/%Y')
                month_key = txn_date.strftime('%B')  # e.g., "May"
                month_index = txn_date.month

                branch = str(txn.get('src_location'))
                items = pos_items_by_pos.get(pos['pos_id'], [])
                total_amount = sum(item['total_price'] for item in items)

                is_dswd = False
                presc = prescription_map.get(pos.get('prescription_id'))
                if presc:
                    cust = customer_map.get(presc.get('customer_id'))
                    cust_type = customer_type_map.get(cust.get('customer_type_id')) if cust else None
                    if cust_type and cust_type.get("discount", 0) >= 100:
                        is_dswd = True

                sales = monthly_sales[(month_index, month_key)][date_key]
                if is_dswd:
                    sales['total_dswd'] += total_amount
                else:
                    if branch == '1':
                        sales['Asuncion'] += total_amount
                    elif branch == '2':
                        sales['Talaingod'] += total_amount
                    sales['regular_sales'] += total_amount

            # Build response
            all_months_response = []
            for (month_index, month_name_str) in sorted(monthly_sales.keys()):
                daily_sales = []
                monthly_regular = 0.0
                monthly_dswd = 0.0

                for date, values in sorted(monthly_sales[(month_index, month_name_str)].items()):
                    rounded_values = {
                        "Asuncion": "{:.2f}".format(values['Asuncion']),
                        "Talaingod": "{:.2f}".format(values['Talaingod']),
                        "regular_sales": "{:.2f}".format(values['regular_sales']),
                        "total_dswd": "{:.2f}".format(values['total_dswd'])
                    }
                    daily_sales.append({
                        "date": date,
                        **rounded_values
                    })
                    monthly_regular += values['regular_sales']
                    monthly_dswd += values['total_dswd']

                all_months_response.append({
                    "month": month_name_str,
                    "daily_sales_summary": daily_sales,
                    "monthly_summary": {
                        "monthly_regular_sales": "{:.2f}".format(monthly_regular),
                        "monthly_total_dswd": "{:.2f}".format(monthly_dswd)
                    }
                })

            return Response(all_months_response, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)



    # def get(self, request, pos_id=None):
    #     try:
    #         order_type = request.query_params.get("order_type")  # e.g., 'DSWD', 'senior citizen'

    #         # Base POS query
    #         query = supabase.table('POS').select('*')

    #         if pos_id is not None:
    #             query = query.eq('pos_id', pos_id)

    #         if order_type is not None:
    #             query = query.ilike('order_type', order_type.lower())

    #         pos_response = query.execute()

    #         if not pos_response.data:
    #             return Response({"error": "No POS records found"}, status=404)

    #         formatted_pos_data = []

    #         for pos in pos_response.data:
    #             try:
    #                 # Fetch POS items with nested product/drug details
    #                 items_response = (
    #                     supabase.table('POS_Item')
    #                     .select("*, Products(*, Drugs(*))")
    #                     .eq("pos_id", pos["pos_id"])
    #                     .execute()
    #                 )

    #                 items = items_response.data if items_response.data else []
    #                 total_amount = 0
    #                 formatted_items = []

    #                 for item in items:
    #                     product = item.get("Products") or {}
    #                     drugs = product.get("Drugs") or {}

    #                     dosage = f"{drugs.get('dosage_form', '')} {drugs.get('dosage_strength', '')}".strip()
    #                     full_name = f"{product.get('product_name', 'Unknown Product')} {dosage}".strip()

    #                     item_total = item["quantity_sold"] * item["price"]
    #                     total_amount += item_total

    #                     formatted_items.append({
    #                         "pos_item_id": item["pos_item_id"],
    #                         "product_id": product.get("product_id", "N/A"),
    #                         "full_product_name": full_name,
    #                         "quantity": item["quantity_sold"],
    #                         "price": item["price"],
    #                         "total_price": item_total
    #                     })

    #                 formatted_pos_data.append({
    #                     "pos_id": pos["pos_id"],
    #                     "sale_date": pos.get("sale_date"),
    #                     "user_id": pos.get("user_id"),
    #                     "invoice": pos.get("invoice"),
    #                     "order_type": pos.get("order_type"),
    #                     "total_amount": total_amount,
    #                     "items": formatted_items
    #                 })

    #             except Exception as item_error:
    #                 print(f"[ERROR] Failed to process POS ID {pos['pos_id']}:")
    #                 print(traceback.format_exc())
    #                 continue  # Skip this broken POS record

    #         if not formatted_pos_data:
    #             return Response({"error": "No valid POS records found"}, status=404)

    #         return Response(formatted_pos_data[0] if pos_id else formatted_pos_data, status=200)

    #     except Exception as e:
    #         print("=== ERROR in POS GET ===")
    #         print(traceback.format_exc())
    #         return Response({"error": str(e)}, status=500)
        
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
            
            if data["discountInfo"]["type"] == "senior":
                data["discountInfo"]["type"] = "senior citizen"

            if data["customerType"] != "regular":
                # Determine source of name based on discount type
                if data["customerType"] == "discount" and data["discountInfo"]["type"] in ["pwd", "senior citizen"]:
                    name_source = data["discountInfo"]["name"]
                    data["customerType"] = data["discountInfo"]["type"]
                else:
                    name_source = data["customerInfo"]["patient_name"]

                name_parts = name_source.strip().split()

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
                customer_type_query = supabase.table("Customer_Type").select("customer_type_id").ilike("description", data["customerType"]).limit(1).execute()

                print(f"🧪 Checking customer type: {data['customerType']}")
                print(f"🧪 Customer type lookup result: {customer_type_query.data}")

                if not customer_type_query.data:
                    return Response({"error": "Invalid customer type"}, status=400)

                customer_type_id = customer_type_query.data[0]["customer_type_id"]

                # Check if this person is already a customer
                existing_customer_query = supabase.table("Customers").select("customer_id") \
                    .eq("person_id", person_id).limit(1).execute()

                if existing_customer_query.data:
                    customer_id = existing_customer_query.data[0]["customer_id"]
                else:
                    # Insert customer
                    customer_insert = supabase.table("Customers").insert({
                        "person_id": person_id,
                        "id_card_number": data["discountInfo"].get("idNumber"),
                        "customer_type_id": customer_type_id
                    }).execute()
                    customer_id = customer_insert.data[0]["customer_id"] if customer_insert.data else None

            # Insert into POS table
            pos_insert = supabase.table("POS").insert({
                "sale_date": transaction_date, "invoice": invoice_number, "user_id": data["user_id"], "order_type": data["customerType"]
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

                prescription_id = prescription_insert.data[0]["prescription_id"] if prescription_insert.data else None
                print(f"🟢 Prescription added with ID={prescription_id} for POS ID: {pos_transaction_id}")

                # ✅ Update POS with prescription_id
                if prescription_id:
                    supabase.table("POS").update({
                        "prescription_id": prescription_id
                    }).eq("pos_id", pos_transaction_id).execute()
                    print(f"🟢 POS updated with prescription_id={prescription_id}")

            # Insert into POS_Item and update Stock_Item
            for item in data["items"]:
                # Fetch stock item (location-specific)
                stock_item_query = supabase.table("Stock_Item").select("stock_item_id") \
                    .eq("product_id", item["product_id"]).eq("location_id", int(data["branch"])).limit(1).execute()

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
            if data["customerType"].upper() == "DSWD":
                # Parse the string to proper ISO format or datetime object (depending on Supabase expectation)
                gl_date = datetime.fromisoformat(data["customerInfo"].get("guaranteeLetterDate")).date()
                claim_date = datetime.fromisoformat(data["customerInfo"].get("receivedDate")).date()
                try:
                    print("🛠 Payload to Supabase:", {
                        "customer_id": customer_id,
                        "gl_num": data["customerInfo"].get("guaranteeLetterNo"),
                        "gl_date": safe_date(gl_date),
                        "claim_date": safe_date(claim_date),
                        "pos_id": pos_transaction_id,
                        "client_name": data["customerInfo"].get("client_name")
                    })
                    response = supabase.table("Dswd_Order").insert({
                        "customer_id": customer_id,
                        "gl_num": data["customerInfo"].get("guaranteeLetterNo"),
                        "gl_date": safe_date(gl_date),
                        "claim_date": safe_date(claim_date),
                        "pos_id": pos_transaction_id,
                        "client_name": data["customerInfo"].get("client_name")
                    }).execute()
                    
                    print("🧾 Supabase Response:", response)
                    print(f"🟢 DSWD Order added for patient ID: {customer_id}")
                except Exception as e:
                    print("❌ Supabase Insert Error:", e)

            return Response({"message": "POS transaction created successfully", "pos_id": pos_transaction_id}, status=201)

        except Exception as e:
            import traceback
            print("❌ Exception:", str(e))
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

