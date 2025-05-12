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
            src_location_ids = set()
            
            # To track which POS IDs we've already processed
            processed_pos_ids = set()

            # Special case for branch 8: include transactions from branches 1 and 3
            branch_filter = []
            if branch == "8":
                branch_filter = ["1", "3"]  # Include transactions from branches 1 and 3
            elif branch:
                branch_filter = [branch]    # Just filter for the requested branch
            
            for txn in stock_transactions.data:
                # Skip if src_location doesn't match our branch filter
                if branch and str(txn.get('src_location')) not in branch_filter and branch_filter:
                    continue
                
                # For POS transactions, we'll only include the first one we encounter for each POS ID
                if txn.get('transaction_type', '').lower() == 'pos':
                    ref_id = txn['reference_id']
                    
                    # Skip this transaction if we've already processed this POS ID
                    if ref_id in processed_pos_ids:
                        continue
                    
                    # Mark this POS ID as processed
                    processed_pos_ids.add(ref_id)
                    pos_ids.add(ref_id)
                
                if txn.get('src_location'):
                    src_location_ids.add(txn['src_location'])
                
                filtered_transactions.append(txn)

            if not filtered_transactions:
                return Response({"error": "No Stock_Transaction matched filters"}, status=404)

            # POS
            pos_list = supabase.table('POS').select('*').in_('pos_id', list(pos_ids)).execute().data
            pos_map = {pos['pos_id']: pos for pos in pos_list}

            # Filter by order_type
            if order_type:
                filtered_transactions = [
                    txn for txn in filtered_transactions
                    if txn['transaction_type'].lower() != 'pos'
                    or (
                        txn['reference_id'] in pos_map and
                        pos_map[txn['reference_id']].get('order_type', '').lower() == order_type.lower()
                    )
                ]

            # POS Items
            pos_item_data = supabase.table('POS_Item').select('*, Products(*, Drugs(*))').in_('pos_id', list(pos_ids)).execute().data
            pos_items_by_pos = {}
            for item in pos_item_data:
                pos_id = item['pos_id']
                product = item.get("Products") or {}
                drugs = product.get("Drugs") or {}
                dosage = f"{drugs.get('dosage_form', '')} {drugs.get('dosage_strength', '')}".strip()
                full_name = f"{product.get('product_name', 'Unknown Product')} {dosage}".strip()
                total_price = item["quantity_sold"] * item["price"]
                formatted_item = {
                    "pos_item_id": item["pos_item_id"],
                    "product_id": product.get("product_id", "N/A"),
                    "full_product_name": full_name,
                    "quantity": item["quantity_sold"],
                    "price": item["price"],
                    "total_price": total_price
                }
                pos_items_by_pos.setdefault(pos_id, []).append(formatted_item)

            # Prescriptions
            prescription_ids = [pos['prescription_id'] for pos in pos_list if pos.get('prescription_id')]
            prescriptions = supabase.table('Prescription').select('*').in_('prescription_id', prescription_ids).execute().data
            prescription_map = {p['prescription_id']: p for p in prescriptions}

            # Customers
            customer_ids = [p['customer_id'] for p in prescriptions if p.get('customer_id')]
            customers = supabase.table('Customers').select('*').in_('customer_id', customer_ids).execute().data
            customer_map = {c['customer_id']: c for c in customers}

            # Persons for customers
            person_ids = [c['person_id'] for c in customers if c.get('person_id')]
            persons = supabase.table('Person').select('*').in_('person_id', person_ids).execute().data
            person_map = {p['person_id']: p for p in persons}

            # Physicians and their persons
            physician_ids = [p['physician_id'] for p in prescriptions if p.get('physician_id')]
            physicians = supabase.table('Physician').select('*').in_('physician_id', physician_ids).execute().data
            physician_map = {d['physician_id']: d for d in physicians}

            physician_person_ids = [d['person_id'] for d in physicians if d.get('person_id')]
            physician_persons = supabase.table('Person').select('*').in_('person_id', physician_person_ids).execute().data
            physician_person_map = {p['person_id']: p for p in physician_persons}

            # Locations
            locations = supabase.table('Location').select('*').in_('location_id', list(src_location_ids)).execute().data
            location_map = {l['location_id']: l['location'] for l in locations}

            # Attach related data
            for txn in filtered_transactions:
                txn.pop('stock_item', None)

                # Format transaction_date to a readable format
                if 'transaction_date' in txn and txn['transaction_date']:
                    try:
                        # Parse the timestamp (it might already be a datetime object or string)
                        if isinstance(txn['transaction_date'], str):
                            dt = datetime.fromisoformat(txn['transaction_date'].replace('Z', '+00:00'))
                        else:
                            dt = txn['transaction_date']
                            
                        # Format as MM/DD/YYYY HH:MM AM/PM
                        txn['transaction_date'] = dt.strftime('%m/%d/%Y %I:%M %p')
                    except Exception as e:
                        # Keep original if formatting fails
                        print(f"Error formatting date: {e}")
                
                # Location name
                txn['src_location_name'] = location_map.get(txn.get('src_location'))

                # POS
                pos = pos_map.get(txn['reference_id'])
                if pos:
                    pos['pos_items'] = pos_items_by_pos.get(pos['pos_id'], [])
                    if "pos_items" in pos:
                        pos["total_amount"] = round(sum(item.get("total_price", 0) for item in pos["pos_items"]), 2)
                    txn['pos'] = pos
                    
                    # Prescription
                    if pos.get('prescription_id'):
                        prescription = prescription_map.get(pos['prescription_id'])
                        if prescription:
                            # Physician
                            if prescription.get('physician_id'):
                                physician = physician_map.get(prescription['physician_id'])
                                if physician:
                                    phys_person_id = physician.get("person_id")
                                    person = physician_person_map.get(phys_person_id) if phys_person_id in physician_person_map else {}
                                    physician.update({
                                        "name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip(),
                                        "address": person.get("address"),
                                        "contact": person.get("contact"),
                                        "email": person.get("email")
                                    })
                                    physician.pop("person_id", None)
                                    prescription["physician"] = physician
                            txn["prescription"] = prescription

                            # Customer
                            if prescription.get('customer_id'):
                                customer = customer_map.get(prescription['customer_id'])
                                if customer:
                                    person_id = customer.get("person_id")
                                    person = person_map.get(person_id) if person_id in person_map else {}
                                    customer.update({
                                        "name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip(),
                                        "address": person.get("address"),
                                        "contact": person.get("contact"),
                                        "email": person.get("email")
                                    })
                                    customer.pop("person_id", None)
                                    txn["customer"] = customer

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
