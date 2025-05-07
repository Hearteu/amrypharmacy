# views.py
from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class StockTransaction(APIView):
    def get(self, request, stock_transaction_id=None, transaction_type=None, branch=None, order_type=None):
        try:
            # Fetch Stock_Transaction records
            query = supabase.table('Stock_Transaction').select('*')

            if stock_transaction_id is not None:
                query = query.eq('stock_transaction_id', stock_transaction_id)

            if transaction_type is not None:
                query = query.filter('LOWER(transaction_type)', 'eq', transaction_type.lower())

            stock_transactions = query.execute()

            if not stock_transactions.data:
                return Response({"error": "No Stock_Transaction found"}, status=404)

            transactions = stock_transactions.data

            # If filtering POS-specific logic
            if transaction_type and transaction_type.lower() == 'pos':
                if branch:
                    transactions = [t for t in transactions if t['src_location'].lower() == branch.lower()]

                # Extract POS reference IDs
                pos_ids = [t['reference_id'] for t in transactions if t.get('reference_id') is not None]

                if pos_ids:
                    pos_query = supabase.table('POS').select('*').in_('pos_id', pos_ids)
                    pos_records = pos_query.execute().data

                    # Filter by order_type if provided
                    if order_type:
                        pos_records = [
                            pos for pos in pos_records 
                            if pos.get('order_type', '').lower() == order_type.lower()
                        ]

                    # Retain only transactions linked to filtered POS records
                    valid_pos_ids = set(pos['pos_id'] for pos in pos_records)
                    transactions = [t for t in transactions if t['reference_id'] in valid_pos_ids]

            if not transactions:
                return Response({"error": "No matching Stock_Transaction after POS/order_type filter"}, status=404)

            # Continue processing: fetch Stock_Item and Product info
            stock_item_ids = list(set(st['stock_item_id'] for st in transactions))

            stock_items = supabase.table('Stock_Item').select('*').in_('stock_item_id', stock_item_ids).execute().data
            product_ids = list(set(si['product_id'] for si in stock_items))

            products = supabase.table('Products').select('*').in_('product_id', product_ids).execute().data

            # Mapping
            stock_item_map = {si['stock_item_id']: si for si in stock_items}
            product_map = {p['product_id']: p for p in products}

            # Attach stock item and product details
            for transaction in transactions:
                stock_item = stock_item_map.get(transaction['stock_item_id'])
                if stock_item:
                    transaction['stock_item'] = stock_item
                    transaction['product'] = product_map.get(stock_item['product_id'], {})

            return Response(transactions, status=200)

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
