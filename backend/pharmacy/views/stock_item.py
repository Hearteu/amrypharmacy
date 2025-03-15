# views.py

from datetime import datetime, timedelta

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class StockItem(APIView):
    def get(self, request, stock_item_id=None):
        try:
            six_months_later = (datetime.now() + timedelta(days=180)).strftime('%Y-%m-%dT%H:%M:%S')

            # ✅ Step 1: Get stock transactions with valid expiry dates
            stock_transaction_query = (
                supabase.table("Stock_Transaction")
                .select("stock_item_id, src_location, des_location, expiry_date")
                .gte("expiry_date", six_months_later)  # Expiry date > 6 months
            )

            if stock_item_id is not None:
                stock_transaction_query = stock_transaction_query.eq("stock_item_id", stock_item_id)

            stock_transaction_response = stock_transaction_query.execute()

            if not stock_transaction_response.data:
                return Response({"error": "No valid stock transactions found"}, status=404)

            # Extract stock_item_ids and map locations
            stock_item_ids = [tx["stock_item_id"] for tx in stock_transaction_response.data]
            location_map = {tx["stock_item_id"]: (tx["src_location"], tx["des_location"]) for tx in stock_transaction_response.data}

            # ✅ Step 2: Get Stock Items matching valid transactions
            stock_item_query = (
                supabase.table("Stock_Item")
                .select("stock_item_id, product_id, quantity, location_id")
                .in_("stock_item_id", stock_item_ids)
            )
            stock_item_response = stock_item_query.execute()

            if not stock_item_response.data:
                return Response({"error": "No matching Stock Items found"}, status=404)

            # ✅ Step 3: Format Response for Transfer Schema
            formatted_response = {
                "src_location_id": location_map[stock_item_response.data[0]["stock_item_id"]][0],  # First item's src_location
                "des_location_id": location_map[stock_item_response.data[0]["stock_item_id"]][1],  # First item's des_location
                "transfer_date": datetime.now().isoformat(),
                "transferItems": [
                    {
                        "stock_transfer_item_id": None,  # New transfer, no ID yet
                        "product_id": item["product_id"],
                        "ordered_quantity": item["quantity"],
                    }
                    for item in stock_item_response.data
                ],
            }

            return Response(formatted_response, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

        
    def post(self, request):
        data = request.data
        try:
           
            response = supabase.table("Stock_Item").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, stock_item_id):
        data = request.data
        try:
            response = supabase.table("Stock_Item").update(data).eq('stock_item_id', stock_item_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Stock_Item not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, stock_item_id):
        try:
            response = supabase.table("Stock_Item").delete().eq('stock_item_id', stock_item_id).execute()

            if response.data:
                return Response({"message": "Stock_Item deleted successfully"}, status=204)
            else:
                return Response({"error": "Stock_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
