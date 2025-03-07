# views.py

from datetime import datetime, timezone

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class POI(APIView):
    def get(self, request, purchase_order_item_id=None):
        """Retrieve a specific Purchase Order Item or all items"""
        try:
            if purchase_order_item_id:
                response = supabase.table("Purchase_Order_Item").select("*").eq("purchase_order_item_id", purchase_order_item_id).execute()
            else:
                response = supabase.table("Purchase_Order_Item").select("*").execute()

            if hasattr(response, "error") and response.error:
                print(f"❌ Error fetching Purchase Order Items: {response.error}")
                return Response({"error": str(response.error)}, status=500)

            data = response.data

            return Response(data, status=200)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)

 
    def put(self, request, purchase_order_item_id=None):
        """Update a Purchase Order Item, insert stock transaction, and update stock item"""
        try:
            data = request.data
            print(f"🟢 Received update request for POI {purchase_order_item_id}: {data}")  # Debugging input

            # Extracting fields from request
            status = data.get("purchase_order_item_status_id", 1)
            to_receive = data.get("received_qty", 0)
            expired_qty = data.get("expired_qty", 0)
            damaged_qty = data.get("damaged_qty", 0)
            expiry_date = data.get("expiry_date", None)

            # Convert expiry_date to proper format or set to NULL
            expiry_date = datetime.fromisoformat(expiry_date).strftime("%Y-%m-%d") if expiry_date else None

            # ✅ Step 1: Get product_id from Purchase_Order_Item -> Supplier_Item -> Product
            poi_query = (
                supabase.table("Purchase_Order_Item")
                .select("supplier_item_id, Supplier_Item (product_id)")
                .eq("purchase_order_item_id", purchase_order_item_id)
                .single()
            )
            poi_result = poi_query.execute()

            if not poi_result.data or "Supplier_Item" not in poi_result.data:
                return Response({"error": "Purchase Order Item or related product not found"}, status=404)

            product_id = poi_result.data["Supplier_Item"]["product_id"]

            # ✅ Step 2: Get stock_item_id using product_id
            stock_item_query = (
                supabase.table("Stock_Item")
                .select("stock_item_id, quantity")
                .eq("product_id", product_id)
                .single()
            )
            stock_item_result = stock_item_query.execute()

            if not stock_item_result.data:
                return Response({"error": "Stock item not found"}, status=404)

            stock_item_id = stock_item_result.data["stock_item_id"]
            current_quantity = stock_item_result.data["quantity"]
            new_quantity = current_quantity + to_receive  # Increase stock

            # ✅ Step 3: Update the Purchase_Order_Item table
            update_response = supabase.table("Purchase_Order_Item").update({
                "purchase_order_item_status_id": status,
                "received_qty": to_receive,
                "expired_qty": expired_qty,
                "damaged_qty": damaged_qty,
                "expiry_date": expiry_date
            }).eq("purchase_order_item_id", purchase_order_item_id).execute()

            if hasattr(update_response, "error") and update_response.error:
                print(f"❌ Error updating Purchase Order Item: {update_response.error}")
                return Response({"error": str(update_response.error)}, status=500)

            # ✅ Step 4: Get Location IDs for src and destination
            supplier_location_query = (
                supabase.table("Location")
                .select("location_id")
                .eq("location", "Supplier")
                .single()
            )
            supplier_location_result = supplier_location_query.execute()

            if not supplier_location_result.data:
                return Response({"error": "Supplier location not found"}, status=404)

            stockroom_location_query = (
                supabase.table("Location")
                .select("location_id")
                .eq("location", "Asuncion - Stockroom")
                .single()
            )
            stockroom_location_result = stockroom_location_query.execute()

            if not stockroom_location_result.data:
                return Response({"error": "Stockroom location not found"}, status=404)

            src_location_id = supplier_location_result.data["location_id"]
            des_location_id = stockroom_location_result.data["location_id"]

            # ✅ Step 5: Insert a Stock Transaction
            transaction_data = {
                "stock_item_id": stock_item_id,
                "transaction_type": "POI",
                "reference_id": purchase_order_item_id,
                "src_location": src_location_id,
                "des_location": des_location_id,
                "quantity_change": to_receive,
                "transaction_date": datetime.now(timezone.utc).isoformat()   # UTC timestamp
            }
            transaction_response = supabase.table("Stock_Transaction").insert(transaction_data).execute()

            # ✅ Step 6: Update Stock_Item quantity
            supabase.table("Stock_Item").update({"quantity": new_quantity}).eq("stock_item_id", stock_item_id).execute()

            print(f"🟢 Successfully updated POI {purchase_order_item_id}, added Stock Transaction, and updated Stock Item")
            return Response({"message": "Purchase Order Item updated successfully, stock recorded"}, status=200)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)

    def delete(self, request, purchase_order_item_id):
        try:
            response = supabase.table("Purchase_Order_Item").delete().eq('purchase_order_item_id', purchase_order_item_id).execute()

            if response.data:
                return Response({"message": "Purchase_Order_Item deleted successfully"}, status=204)
            else:
                return Response({"error": "Purchase_Order_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)