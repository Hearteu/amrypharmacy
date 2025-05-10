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

            if transaction_type:
                query = query.ilike('transaction_type', transaction_type)

            stock_transactions = query.execute()

            if not stock_transactions.data:
                return Response({"error": "No Stock_Transaction found"}, status=404)

            filtered_transactions = []
            pos_ids = set()

            for txn in stock_transactions.data:
                if branch:
                    if str(txn.get('src_location')) != branch:
                        continue

                if txn.get('transaction_type', '').lower() == 'pos':
                    pos_ids.add(txn['reference_id'])

                filtered_transactions.append(txn)

            if not filtered_transactions:
                return Response({"error": "No Stock_Transaction matched filters"}, status=404)

            # Fetch all related POS records
            pos_list = supabase.table('POS').select('*').in_('pos_id', list(pos_ids)).execute().data
            pos_map = {pos['pos_id']: pos for pos in pos_list}

            # Filter by order_type if provided
            if order_type:
                filtered_transactions = [
                    txn for txn in filtered_transactions
                    if txn['transaction_type'].lower() != 'pos'
                    or (
                        txn['reference_id'] in pos_map and
                        pos_map[txn['reference_id']].get('order_type', '').lower() == order_type.lower()
                    )
                ]

            # Get unique prescription_ids from POS
            prescription_ids = [pos['prescription_id'] for pos in pos_list if 'prescription_id' in pos and pos['prescription_id']]
            prescriptions = supabase.table('Prescription').select('*').in_('prescription_id', prescription_ids).execute().data
            prescription_map = {p['prescription_id']: p for p in prescriptions}

            # Get unique customer_ids from Prescription
            customer_ids = [p['customer_id'] for p in prescriptions if 'customer_id' in p and p['customer_id']]
            customers = supabase.table('Customers').select('*').in_('customer_id', customer_ids).execute().data
            customer_map = {c['customer_id']: c for c in customers}

            # Get unique person_ids from Customers
            person_ids = [c['person_id'] for c in customers if 'person_id' in c and c['person_id']]
            person = supabase.table('Person').select('*').in_('person_id', person_ids).execute().data
            person_map = {p['person_id']: p for p in person}

            # Attach data
            for txn in filtered_transactions:
                txn.pop('stock_item', None)  # Remove stock_item if present
                pos = pos_map.get(txn['reference_id'])
                txn['pos'] = pos

                if pos and pos.get('prescription_id'):
                    prescription = prescription_map.get(pos['prescription_id'])
                    txn['prescription'] = prescription

                    if prescription and prescription.get('customer_id'):
                        customer = customer_map.get(prescription['customer_id'])
                        txn['customer'] = customer

                        if customer and customer.get('person_id'):
                            person = person_map.get(customer['person_id'])
                            txn['person'] = person

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
