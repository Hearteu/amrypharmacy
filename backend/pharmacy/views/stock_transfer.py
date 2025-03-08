# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class StockTransfer(APIView):
    def get(self, request, stock_transfer_id=None):
        """Retrieve all stock transfers or a single stock transfer by ID with transferItems"""
        try:
            query = supabase.table("Stock_Transfer").select(
                "stock_transfer_id, transfer_id, transfer_date, expected_arrival_date, stock_transfer_status_id, notes, "
                "Stock_Transfer_Status!inner(stock_transfer_status), " 
                "src_location, des_location, "
                "Stock_Transfer_Item (stock_transfer_item_id, sti_id, ordered_quantity, stock_transfer_item_status_id, "
                "unit_id, transferred_qty, Unit (unit), "
                "Products (product_id, product_name))"
            )

            if stock_transfer_id is not None:
                query = query.eq("stock_transfer_id", stock_transfer_id).single()

            response = query.execute()

            if not response.data:
                return Response({"error": "No stock transfers found"}, status=404)

            stock_transfers = [response.data] if isinstance(response.data, dict) else response.data
            formatted_transfers = []

            for transfer in stock_transfers:
                stock_transfer_items = transfer.get("Stock_Transfer_Item", [])

                formatted_transfer = {
                    "stock_transfer_id": transfer["stock_transfer_id"],
                    "transfer_id": transfer["transfer_id"],
                    "transfer_date": transfer["transfer_date"],
                    "expected_arrival_date": transfer["expected_arrival_date"],
                    "status_id": transfer["stock_transfer_status_id"],
                    "status": transfer.get("Stock_Transfer_Status", {}).get("stock_transfer_status", "Unknown"),
                    "notes": transfer["notes"],
                    "src_location": transfer.get("src_location", "Unknown"),
                    "des_location": transfer.get("des_location", "Unknown"),
                    "transferItems": [],
                }

                for item in stock_transfer_items:
                    product = item.get("Products", {})
                    product_id = product.get("product_id", "N/A")
                    product_name = product.get("product_name", "Unknown Product")

                    formatted_transfer["transferItems"].append({
                        "stock_transfer_item_id": item["stock_transfer_item_id"],
                        "sti_id": item.get("sti_id", ""),
                        "product_id": product_id,
                        "product_name": product_name,
                        "ordered_quantity": item["ordered_quantity"],
                        "transferred_qty": item.get("transferred_qty", 0),
                        "stock_transfer_item_status_id": item.get("stock_transfer_item_status_id", "Unknown"),
                        "unit_id": item.get("unit_id", "N/A"),
                        "unit": item.get("Unit", {}).get("unit", "N/A")
                    })

                formatted_transfers.append(formatted_transfer)

            return Response(formatted_transfers if stock_transfer_id is None else formatted_transfers[0], status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
           
            response = supabase.table("Stock_Transfer").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, stock_transfer_id):
        data = request.data
        try:
            response = supabase.table("Stock_Transfer").update(data).eq('stock_transfer_id', stock_transfer_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Customer not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, stock_transfer_id):
        try:
            response = supabase.table("Stock_Transfer").delete().eq('stock_transfer_id', stock_transfer_id).execute()

            if response.data:
                return Response({"message": "Customer deleted successfully"}, status=204)
            else:
                return Response({"error": "Customer not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
