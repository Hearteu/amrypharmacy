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
            query = supabase.table('POS').select('*')
            if pos_id is not None:
                query = query.eq('pos_id', pos_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No POS found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    def post(self, request):
        """Create a new POS transaction with detailed customer, discount, and prescription handling."""
        try:
            data = request.data
            print(f"🟢 Received POS request data: {data}")  # Debugging

            current_year = datetime.now().year

            # Fetch latest pos_id for invoice number generation
            latest_pos_query = supabase.table("POS").select("pos_id") \
                .order("pos_id", desc=True) \
                .limit(1) \
                .execute()

            pos_id = latest_pos_query.data[0]["pos_id"] + 1 if latest_pos_query.data else 1
            invoice_number = f"POS-{current_year}-{pos_id:03d}"

            transaction_date = datetime.fromisoformat(data["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")

            customer_id = None
            if data["customerType"] != "regular":
                # Extract first and last name for Person table
                name_parts = data["customerInfo"]["name"].split()
                first_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else name_parts[0]
                last_name = name_parts[-1] if len(name_parts) > 1 else ""

                # ✅ Fix: Check if person exists before inserting
                person_query = supabase.table("Person").select("person_id") \
                    .eq("first_name", first_name) \
                    .eq("last_name", last_name) \
                    .limit(1).execute()
                if person_query.data:
                    person_id = person_query.data[0]["person_id"]
                else:
                    person_insert = supabase.table("Person").insert({
                        "first_name": first_name,
                        "last_name": last_name,
                        "address": None,
                        "contact": None,
                        "email": None
                    }).execute()
                    person_id = person_insert.data[0]["person_id"]

                # ✅ Fix: Check if customer type exists before inserting
                customer_type_query = supabase.table("Customer_Type").select("customer_type_id") \
                    .eq("description", data["customerType"]).limit(1).execute()
                if customer_type_query.data:
                    customer_type_id = customer_type_query.data[0]["customer_type_id"]
                else:
                    return Response({"error": "Invalid customer type"}, status=400)

                # Insert into Customers table
                customer_insert = supabase.table("Customers").insert({
                    "person_id": person_id,
                    "id_card_number": data["discountInfo"].get("idNumber"),
                    "customer_type_id": customer_type_id
                }).execute()
                customer_id = customer_insert.data[0]["customer_id"]

            # Insert into POS table
            pos_insert = supabase.table("POS").insert({
                "sale_date": transaction_date,
                "user_id": None,  # Replace with actual user_id if available
                "invoice": invoice_number
            }).execute()

            pos_transaction_id = pos_insert.data[0]["pos_id"]
            print(f"🟢 POS Transaction Created: ID={pos_transaction_id}, Invoice={invoice_number}")  # Debugging

            # Insert Prescription if available
            if "prescriptionInfo" in data:
                prescription = data["prescriptionInfo"]

                # ✅ Fix: Check if physician exists in Physician table before inserting
                physician_query = supabase.table("Physician").select("physician_id, person_id") \
                    .eq("prc_num", prescription["PRCNumber"]) \
                    .eq("ptr_num", prescription["PTRNumber"]) \
                    .limit(1).execute()

                if physician_query.data:
                    # Physician already exists, reuse their ID
                    physician_id = physician_query.data[0]["physician_id"]
                    physician_person_id = physician_query.data[0]["person_id"]
                else:
                    # Check if doctor exists in Person table (avoid duplicate persons)
                    person_query = supabase.table("Person").select("person_id") \
                        .eq("first_name", prescription["doctorName"]).limit(1).execute()

                    if person_query.data:
                        physician_person_id = person_query.data[0]["person_id"]
                    else:
                        # Insert new person for doctor
                        person_insert = supabase.table("Person").insert({
                            "first_name": prescription["doctorName"],
                            "last_name": "",
                            "address": None,
                            "contact": None,
                            "email": None
                        }).execute()
                        physician_person_id = person_insert.data[0]["person_id"]

                    # Insert into Physician table
                    physician_insert = supabase.table("Physician").insert({
                        "person_id": physician_person_id,
                        "prc_num": prescription["PRCNumber"],
                        "ptr_num": prescription["PTRNumber"]
                    }).execute()
                    physician_id = physician_insert.data[0]["physician_id"]

                # Insert into Prescription table
                prescription_insert = supabase.table("Prescription").insert({
                    "customer_id": customer_id,
                    "physician_id": physician_id,
                    "prescription_details": prescription.get("notes", ""),
                    "date_issued": prescription["prescriptionDate"]
                }).execute()

                print(f"🟢 Prescription added for POS ID: {pos_transaction_id}")

            # Insert into POS_Item table
            pos_items = []
            for item in data["items"]:
                pos_items.append({
                    "pos_id": pos_transaction_id,
                    "product_id": item["product_id"],
                    "price": item["price"],
                    "quantity_sold": item["quantity"]
                })

            if pos_items:
                item_insert = supabase.table("POS_Item").insert(pos_items).execute()
                print(f"🟢 Successfully inserted {len(pos_items)} items into POS_Item.")

            # Insert into DSWD_Order if applicable
            if data["customerType"] == "dswd":
                dswd_order_insert = supabase.table("DSWD_Order").insert({
                    "patient_id": customer_id,
                    "gl_num": data["customerInfo"].get("guaranteeLetterNo"),
                    "gl_date": data["customerInfo"].get("guaranteeLetterDate"),
                    "claim_date": data["customerInfo"].get("receivedDate")
                }).execute()
                print(f"🟢 DSWD Order added for patient ID: {customer_id}")

            return Response({"message": "POS transaction created successfully", "pos_id": pos_transaction_id}, status=201)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
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
