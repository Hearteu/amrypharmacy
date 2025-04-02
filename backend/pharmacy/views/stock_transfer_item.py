# views.py

from datetime import datetime, timezone

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class STI(APIView):
    def get(self, request, stock_transfer_item_id=None):
        """Retrieve a specific Purchase Order Item or all items"""
        try:
            if stock_transfer_item_id:
                response = supabase.table("Stock_Transfer_Item").select("*").eq("stock_transfer_item_id", stock_transfer_item_id).execute()
            else:
                response = supabase.table("Stock_Transfer_Item").select("*").execute()

            if hasattr(response, "error") and response.error:
                print(f"❌ Error fetching Purchase Order Items: {response.error}")
                return Response({"error": str(response.error)}, status=500)

            data = response.data

            return Response(data, status=200)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)

 
    def put(self, request, stock_transfer_item_id=None):
        """Update a Purchase Order Item, insert stock transaction, and update stock item"""
        try:
            data = request.data
            print(f"🟢 Received update request for POI {stock_transfer_item_id}: {data}")  # Debugging input

            # Extracting fields from request
            status = data.get("purchase_order_item_status_id", 1)
            to_receive = data.get("received_qty", 0)
            expired_qty = data.get("expired_qty", 0)
            damaged_qty = data.get("damaged_qty", 0)
            expiry_date = data.get("expiry_date", None)

            expiry_date = datetime.fromisoformat(expiry_date).strftime("%Y-%m-%d") if expiry_date else None

            # ✅ Step 1: Get product_id and ordered_qty from Stock_Transfer_Item
            poi_query = (
                supabase.table("Stock_Transfer_Item")
                .select("supplier_item_id, ordered_qty, Supplier_Item (product_id)")
                .eq("stock_transfer_item_id", stock_transfer_item_id)
                .single()
            )
            poi_result = poi_query.execute()

            if not poi_result.data or "Supplier_Item" not in poi_result.data:
                return Response({"error": "Purchase Order Item or related product not found"}, status=404)

            product_id = poi_result.data["Supplier_Item"]["product_id"]
            ordered_qty = poi_result.data["ordered_qty"]

            # ✅ Step 2: Get stock_item_id
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
            new_quantity = current_quantity + to_receive

            # ✅ Step 3: Update the Stock_Transfer_Item table
            update_response = supabase.table("Stock_Transfer_Item").update({
                "purchase_order_item_status_id": status,
                "received_qty": to_receive,
                "expired_qty": expired_qty,
                "damaged_qty": damaged_qty,
                "expiry_date": expiry_date
            }).eq("stock_transfer_item_id", stock_transfer_item_id).execute()

            if hasattr(update_response, "error") and update_response.error:
                print(f"❌ Error updating Purchase Order Item: {update_response.error}")
                return Response({"error": str(update_response.error)}, status=500)

            # ✅ Step 4: Validate before inserting stock transaction
            total_qty_handled = to_receive + expired_qty + damaged_qty
            if total_qty_handled == ordered_qty:
                # ✅ Step 5: Get Location IDs for src and destination
                location_query = (
                    supabase.table("Location")
                    .select("location, location_id")
                    .in_("location", ["Supplier", "Asuncion - Stockroom"])
                )
                location_result = location_query.execute()

                if not location_result.data or len(location_result.data) < 2:
                    return Response({"error": "One or more locations not found"}, status=404)

                location_map = {loc["location"]: loc["location_id"] for loc in location_result.data}
                src_location_id = location_map.get("Supplier")
                des_location_id = location_map.get("Asuncion - Stockroom")

                # ✅ Step 6: Insert a Stock Transaction
                transaction_data = {
                    "stock_item_id": stock_item_id,
                    "transaction_type": "POI",
                    "reference_id": stock_transfer_item_id,
                    "src_location": src_location_id,
                    "des_location": des_location_id,
                    "quantity_change": to_receive,
                    "transaction_date": datetime.now(timezone.utc).isoformat()  # UTC timestamp
                }
                transaction_response = supabase.table("Stock_Transaction").insert(transaction_data).execute()

                # ✅ Step 7: Update Stock_Item quantity
                supabase.table("Stock_Item").update({"quantity": new_quantity}).eq("stock_item_id", stock_item_id).execute()

                print(f"🟢 Successfully updated POI {stock_transfer_item_id}, added Stock Transaction, and updated Stock Item")
            else:
                print(f"⚠️ Stock transaction skipped: {total_qty_handled} ≠ {ordered_qty}")

            return Response({"message": "Purchase Order Item updated successfully"}, status=200)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)


    def delete(self, request, stock_transfer_item_id):
        try:
            response = supabase.table("Stock_Transfer_Item").delete().eq('stock_transfer_item_id', stock_transfer_item_id).execute()

            if response.data:
                return Response({"message": "Stock_Transfer_Item deleted successfully"}, status=204)
            else:
                return Response({"error": "Stock_Transfer_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)