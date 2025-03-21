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
        """Create a new POS transaction with detailed customer and discount info"""
        try:
            data = request.data
            print(f"🟢 Received POS request data: {data}")  # Debugging
            # return Response({"message": "POS transaction created successfully"}, status=201)

            current_year = datetime.now().year

            # Fetch the latest pos_id for the current year
            latest_pos_query = supabase.table("POS").select("pos_id") \
                .like("pos_id", f"POS-{current_year}-%") \
                .order("pos_id", desc=True) \
                .limit(1) \
                .execute()

            if latest_pos_query.data:
                latest_pos_id = latest_pos_query.data[0]["pos_id"]
                last_number = int(latest_pos_id.split("-")[-1])  # Extract last number
                next_number = f"{last_number + 1:03d}"  # Increment and format as 3 digits
            else:
                next_number = "001"  # Start with 001 if no previous transactions exist

            # Generate the new pos_id
            pos_id = f"POS-{current_year}-{next_number}"
            print(f"🟢 Generated POS ID: {pos_id}")  # Debugging

            transaction_date = datetime.fromisoformat(data["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")

            customer_insert = supabase.table("Customers").insert({
                "customer_type": data["customerType"],
                "customer_name": data["customerInfo"]["name"],
            }).execute()

            # ✅ Insert into POS table
            pos_insert = supabase.table("POS").insert({
                "pos_id": pos_id,
                "branch": data["branch"],
                "guarantee_letter_no": data["customerInfo"].get("guaranteeLetterNo"),
                "customer_address": data["customerInfo"].get("address"),
                "invoice_number": data["customerInfo"]["invoiceNumber"],
                "discount": data["discount"],
                "discount_type": data["discountInfo"].get("type"),
                "discount_id_number": data["discountInfo"].get("idNumber"),
                "discount_rate": data["discountInfo"].get("discountRate"),
                "subtotal": data["subtotal"],
                "total": data["total"],
                "payment_amount": data["paymentAmount"],
                "change": data["change"],
                "transaction_date": transaction_date
            }).execute()

            if hasattr(pos_insert, "error") and pos_insert.error:
                print(f"❌ Error inserting POS: {pos_insert.error}")
                return Response({"error": str(pos_insert.error)}, status=500)

            pos_transaction_id = pos_insert.data[0]["pos_transaction_id"]
            print(f"🟢 POS Transaction Created: ID={pos_transaction_id}, Custom POS ID={pos_id}")  # Debugging

            # ✅ Insert prescription info (if provided)
            if "prescriptionInfo" in data:
                prescription = data["prescriptionInfo"]
                supabase.table("POS_Prescription").insert({
                    "pos_transaction_id": pos_transaction_id,
                    "doctor_name": prescription["doctorName"],
                    "prescription_number": prescription["prescriptionNumber"],
                    "prescription_date": datetime.fromisoformat(prescription["prescriptionDate"]).strftime("%Y-%m-%d"),
                    "notes": prescription.get("notes", "")
                }).execute()
                print(f"🟢 Prescription info added for POS ID: {pos_id}")

            # ✅ Insert line items
            pos_items = []
            for index, item in enumerate(data["items"], start=1):
                print(f"🔹 Processing POS Item {index}: {item}")  # Debugging

                pos_items.append({
                    "pos_transaction_id": pos_transaction_id,
                    "product_id": item["id"],
                    "product_name": item["name"],
                    "category": item["category"],
                    "quantity": item["quantity"],
                    "unit_price": item["price"],
                    "subtotal": item["quantity"] * item["price"]
                })

            if pos_items:
                item_insert = supabase.table("POS_Item").insert(pos_items).execute()

                if hasattr(item_insert, "get") and item_insert.get("error"):
                    print(f"❌ Error inserting POS Items: {item_insert.get('error')}")
                    return Response({"error": str(item_insert.get('error'))}, status=500)

                print(f"🟢 Successfully inserted {len(pos_items)} items into POS_Item.")

            return Response({"message": "POS transaction created successfully", "pos_id": pos_id}, status=201)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)
 
    def put(self, request, pos_id):
        data = request.data
        try:
            response = supabase.table("POS").update(data).eq('pos_id', pos_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "POS not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, pos_id):
        try:
            response = supabase.table("POS").delete().eq('pos_id', pos_id).execute()

            if response.data:
                return Response({"message": "POS deleted successfully"}, status=204)
            else:
                return Response({"error": "POS not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
