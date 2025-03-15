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
        """Update a Purchase Order Item, insert stock transaction, and update stock item by location"""
        try:
            data = request.data
            print(f"🟢 Received update request for POI {purchase_order_item_id}: {data}")  # Debugging input

            # Extracting fields from request
            status = data.get("purchase_order_item_status_id", 1)
            to_receive = data.get("received_qty", 0)
            expired_qty = data.get("expired_qty", 0)
            damaged_qty = data.get("damaged_qty", 0)
            expiry_date = data.get("expiry_date", None)

            expiry_date = datetime.fromisoformat(expiry_date).strftime("%Y-%m-%d") if expiry_date else None

            # ✅ Step 1: Get product_id and ordered_qty from Purchase_Order_Item
            poi_query = (
                supabase.table("Purchase_Order_Item")
                .select("supplier_item_id, ordered_qty, Supplier_Item (product_id)")
                .eq("purchase_order_item_id", purchase_order_item_id)
                .maybe_single()  # Avoids error if no result
            )
            poi_result = poi_query.execute()

            if not poi_result.data or "Supplier_Item" not in poi_result.data:
                return Response({"error": "Purchase Order Item or related product not found"}, status=404)

            product_id = poi_result.data["Supplier_Item"]["product_id"]
            ordered_qty = poi_result.data["ordered_qty"]

            # ✅ Step 2: Get Location IDs for src and destination
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

            # ✅ Step 3: Get stock_item_id based on product_id and location
            stock_item_query = (
                supabase.table("Stock_Item")
                .select("stock_item_id, quantity")
                .eq("product_id", product_id)
                .eq("location_id", des_location_id)  # Filter by destination location
                .maybe_single()  # Avoids error if no result
            )
            stock_item_result = stock_item_query.execute()

            if stock_item_result.data:
                stock_item_id = stock_item_result.data["stock_item_id"]
                current_quantity = stock_item_result.data["quantity"]
                new_quantity = current_quantity + to_receive
            else:
                # ✅ Create a new stock entry if it doesn't exist for the location
                new_stock_item_data = {
                    "product_id": product_id,
                    "location_id": des_location_id,  # Assign destination location
                    "quantity": to_receive,
                }
                stock_insert_response = supabase.table("Stock_Item").insert(new_stock_item_data).execute()

                if stock_insert_response.data:
                    stock_item_id = stock_insert_response.data[0]["stock_item_id"]  # Get the newly inserted ID
                    new_quantity = to_receive
                else:
                    return Response({"error": "Failed to create stock item"}, status=500)

            # ✅ Step 4: Update the Purchase_Order_Item table
            update_response = supabase.table("Purchase_Order_Item").update({
                "purchase_order_item_status_id": status,
                "received_qty": to_receive,
                "expired_qty": expired_qty,
                "damaged_qty": damaged_qty
            }).eq("purchase_order_item_id", purchase_order_item_id).execute()

            if hasattr(update_response, "error") and update_response.error:
                print(f"❌ Error updating Purchase Order Item: {update_response.error}")
                return Response({"error": str(update_response.error)}, status=500)

            # ✅ Step 5: Validate before inserting stock transaction
            total_qty_handled = to_receive + expired_qty + damaged_qty
            if total_qty_handled == ordered_qty:
                # ✅ Step 6: Insert a Stock Transaction (Now with a valid stock_item_id)
                transaction_data = {
                    "stock_item_id": stock_item_id,  # Now we have a valid stock_item_id
                    "transaction_type": "POI",
                    "reference_id": purchase_order_item_id,
                    "src_location": src_location_id,
                    "des_location": des_location_id,
                    "quantity_change": to_receive,
                    "transaction_date": datetime.now(timezone.utc).isoformat(),  # UTC timestamp
                    "expiry_date": expiry_date  # ✅ Add expiry date here
                }

                transaction_response = supabase.table("Stock_Transaction").insert(transaction_data).execute()

                # ✅ Step 7: Update Stock_Item quantity
                supabase.table("Stock_Item").update({"quantity": new_quantity}) \
                    .eq("stock_item_id", stock_item_id).execute()

                print(f"🟢 Successfully updated POI {purchase_order_item_id}, added Stock Transaction, and updated Stock Item")
            else:
                print(f"⚠️ Stock transaction skipped: {total_qty_handled} ≠ {ordered_qty}")

            return Response({"message": "Purchase Order Item updated successfully"}, status=200)

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