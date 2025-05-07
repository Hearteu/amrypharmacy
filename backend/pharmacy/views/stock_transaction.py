# views.py
from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class StockTransaction(APIView):
    def get(self, request):
        try:
            transaction_type = request.query_params.get('transaction_type')
            order_type = request.query_params.get('order_type')
            branch = request.query_params.get('branch')

            query = supabase.table('Stock_Transaction').select('*')

            # Filter by transaction_type = POS (case-insensitive)
            if transaction_type:
                query = query.ilike('transaction_type', transaction_type)

            # Apply the query
            stock_transactions = query.execute()

            if not stock_transactions.data:
                return Response({"error": "No Stock_Transaction found"}, status=404)

            # Filter branch (after fetch since Supabase doesn't support OR natively in client)
            filtered_transactions = []
            for txn in stock_transactions.data:
                if branch:
                    if str(txn.get('src_location')) != branch and str(txn.get('des_location')) != branch:
                        continue

                # Filter order_type for POS only
                if order_type and txn.get('transaction_type', '').lower() == 'pos':
                    pos = supabase.table('POS').select('order_type').eq('pos_id', txn['reference_id']).single().execute()
                    if pos.data is None or pos.data.get('order_type', '').lower() != order_type.lower():
                        continue

                filtered_transactions.append(txn)

            if not filtered_transactions:
                return Response({"error": "No Stock_Transaction matched filters"}, status=404)

            # Get unique stock_item_ids
            stock_item_ids = list(set(txn['stock_item_id'] for txn in filtered_transactions))

            stock_items = supabase.table('Stock_Item').select('*').in_('stock_item_id', stock_item_ids).execute()
            stock_item_map = {item['stock_item_id']: item for item in stock_items.data}

            # Get product_ids
            product_ids = list(set(item['product_id'] for item in stock_items.data))
            products = supabase.table('Products').select('*').in_('product_id', product_ids).execute()
            product_map = {prod['product_id']: prod for prod in products.data}

            # Attach related data
            for txn in filtered_transactions:
                stock_item = stock_item_map.get(txn['stock_item_id'])
                txn['stock_item'] = stock_item
                txn['product'] = product_map.get(stock_item['product_id']) if stock_item else None

            return Response(filtered_transactions, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


    def post(self, request):
        data = request.data
        try:
            stock_item_id = data.get("stock_item_id")
            transaction_type = data.get("transaction_type")
            reference_id = data.get("reference_id")
            quantity_change = data.get("quantity_change")
            src_location = data.get("src_location")
            des_location = data.get("des_location")
            
            # Ensure transaction_date is in ISO format (Supabase timestamptz requirement)
            transaction_date = data.get("transaction_date", datetime.utcnow().isoformat() + "Z")  # Default to now in UTC

            # Validate stock item
            stock_item_query = supabase.table("Stock_Item").select("*").eq("stock_item_id", stock_item_id).single()
            stock_item = stock_item_query.execute()

            if not stock_item.data:
                return Response({"error": "Stock item not found"}, status=404)

            current_quantity = stock_item.data["quantity"]

            # Validate reference_id based on transaction type
            valid_reference = False
            if transaction_type == "POI":
                valid_reference = supabase.table("Purchase_Order_Item").select("poi_id").eq("poi_id", reference_id).execute().data
            elif transaction_type == "POS":
                valid_reference = supabase.table("POS_Item").select("pos_item_id").eq("pos_item_id", reference_id).execute().data
            elif transaction_type == "Stock_Transfer":
                valid_reference = supabase.table("Stock_Transfer").select("stock_transfer_id").eq("stock_transfer_id", reference_id).execute().data

            if not valid_reference:
                return Response({"error": f"Invalid reference ID for transaction type {transaction_type}"}, status=400)

            # Ensure stock doesn't go negative for outbound transactions
            if quantity_change < 0 and current_quantity + quantity_change < 0:
                return Response({"error": "Insufficient stock"}, status=400)

            # Insert stock transaction
            transaction_data = {
                "stock_item_id": stock_item_id,
                "transaction_type": transaction_type,
                "reference_id": reference_id,
                "src_location": src_location,
                "des_location": des_location,
                "quantity_change": quantity_change,
                "transaction_date": transaction_date  # Ensure this is in ISO format
            }
            response = supabase.table("Stock_Transaction").insert(transaction_data).execute()

            # Update Stock_Item quantity
            updated_quantity = current_quantity + quantity_change
            supabase.table("Stock_Item").update({"quantity": updated_quantity}).eq("stock_item_id", stock_item_id).execute()

            return Response(response.data, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, stock_transaction_id):
        data = request.data 
        try:
            response = supabase.table("Stock_Transaction").update(data).eq('stock_transaction_id', stock_transaction_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Customer not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, stock_transaction_id):
        try:
            response = supabase.table("Stock_Transaction").delete().eq('stock_transaction_id', stock_transaction_id).execute()

            if response.data:
                return Response({"message": "Customer deleted successfully"}, status=204)
            else:
                return Response({"error": "Customer not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
