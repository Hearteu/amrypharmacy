# views.py

import time
import traceback
from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Expiration(APIView):
    def get(self, request):
        try:
            now = datetime.now()
            start_of_month = now.replace(day=1).strftime('%Y-%m-%d')
            if now.month == 12:
                end_of_month = now.replace(year=now.year + 1, month=1, day=1).strftime('%Y-%m-%d')
            else:
                end_of_month = now.replace(month=now.month + 1, day=1).strftime('%Y-%m-%d')

            expiration_id = request.GET.get('expiration_id')
            product_id = request.GET.get('product_id')
            location_id = request.GET.get('location_id')

            # Add retry logic for database connection issues
            max_retries = 3
            retry_count = 0
            
            while retry_count < max_retries:
                try:
                    expiration_query = supabase.table('Expiration').select('*')

                    if expiration_id:
                        expiration_query = expiration_query.eq('expiration_id', int(expiration_id))
                    else:
                        expiration_query = expiration_query.gte('expiry_date', start_of_month).lt('expiry_date', end_of_month)

                    expiration_response = expiration_query.execute()
                    
                    # If we get here, the query was successful
                    break
                except Exception as conn_error:
                    retry_count += 1
                    if retry_count >= max_retries:
                        return Response({"error": f"Database connection error after {max_retries} attempts: {str(conn_error)}"}, status=503)
                    
                    # Wait before retrying (exponential backoff)
                    time.sleep(1 * retry_count)

            if not expiration_response.data:
                return Response({"error": "No Expiration records found."}, status=404)

            enriched_data = []

            for exp in expiration_response.data:

                if exp['quantity'] == 0:
                    continue
                
                stock_item_id = exp['stock_item_id']

                # Add retry logic for each related query
                retry_count = 0
                while retry_count < max_retries:
                    try:
                        # Stock Item
                        stock_resp = supabase.table('Stock_Item').select('*') \
                            .eq('stock_item_id', stock_item_id).single().execute()
                        
                        if not stock_resp.data:
                            break  # Skip this item
                            
                        stock_item = stock_resp.data

                        # Filters
                        if product_id and stock_item['product_id'] != int(product_id):
                            break  # Skip this item
                        if location_id and stock_item['location_id'] != int(location_id):
                            break  # Skip this item

                        # Product
                        product_resp = supabase.table('Products').select('*') \
                            .eq('product_id', stock_item['product_id']).single().execute()
                        product = product_resp.data or {}

                        # Location (flattened)
                        location_resp = supabase.table('Location').select('*') \
                            .eq('location_id', stock_item['location_id']).single().execute()
                        location = location_resp.data or {}
                        
                        # If we get here, all queries were successful
                        break
                    except Exception as conn_error:
                        retry_count += 1
                        if retry_count >= max_retries:
                            # Log the error but continue with other items
                            print(f"Error processing item {exp['expiration_id']}: {str(conn_error)}")
                            continue
                        
                        # Wait before retrying
                        time.sleep(0.5 * retry_count)
                
                # Skip if we couldn't get the related data after retries
                if retry_count >= max_retries or not stock_resp.data:
                    continue

                # Build full name
                dosage = f"{product.get('dosage_form', '')} {product.get('dosage_strength', '')}".strip()
                full_product_name = f"{product.get('product_name', 'Unknown Product')} {dosage}".strip()

                # Remove product_name from product fields
                product.pop("product_name", None)

                # Calculate days until expiry
                expiry_date_obj = datetime.strptime(exp['expiry_date'], "%Y-%m-%d")
                days_until_expiry = (expiry_date_obj - now).days

                # Final structure
                enriched_data.append({
                    "expiration_id": exp['expiration_id'],
                    "expiry_date": exp['expiry_date'],
                    "days_until_expiry": days_until_expiry,
                    "quantity": exp['quantity'],
                    "location_id": location.get("location_id"),
                    "location": location.get("location"),
                    "Stock_Item": {
                        "stock_item_id": stock_item['stock_item_id'],
                        "quantity": stock_item['quantity'],
                        "Product": {
                            "product_id": product.get('product_id'),
                            "full_product_name": full_product_name,
                            **{k: v for k, v in product.items() if k != "product_name"}
                        }
                    }
                })

            return Response(enriched_data, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data 
        try:
           
            response = supabase.table("Expiration").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request):
        data = request.data
        stock_item_id = data.get("stock_item_id")
        expiration_id = data.get("expiration_id")
        quantity_to_dispose = data.get("quantity")
        disposal_date = data.get("disposal_date")
        
        if not all([stock_item_id, expiration_id, quantity_to_dispose, disposal_date]):
            return Response({"error": "Missing required fields"}, status=400)

        try:
            quantity_to_dispose = int(quantity_to_dispose)

            # 1. Get current stock quantity and src_location
            stock_response = supabase.table("Stock_Item").select("quantity, location_id").eq("stock_item_id", stock_item_id).single().execute()
            if not stock_response.data:
                return Response({"error": "Stock item not found"}, status=404)

            current_quantity = int(stock_response.data["quantity"])
            src_location = stock_response.data["location_id"]

            if quantity_to_dispose > current_quantity:
                return Response({"error": "Disposal quantity exceeds available stock"}, status=400)

            # 2. Get current expiration quantity
            expiration_response = supabase.table("Expiration").select("quantity").eq("expiration_id", expiration_id).single().execute()
            if not expiration_response.data:
                return Response({"error": "Expiration record not found"}, status=404)

            expiration_quantity = int(expiration_response.data["quantity"])
            if quantity_to_dispose > expiration_quantity:
                return Response({"error": "Disposal quantity exceeds expiration quantity"}, status=400)

            # 3. Insert stock transaction with src_location
            transaction_data = {
                "stock_item_id": stock_item_id,
                "transaction_type": "Expired Item Disposal",
                "quantity_change": -quantity_to_dispose,
                "disposed_date": disposal_date,
                "src_location": src_location
            }
            supabase.table("Stock_Transaction").insert(transaction_data).execute()

            # 4. Update stock item quantity
            updated_stock_quantity = current_quantity - quantity_to_dispose
            supabase.table("Stock_Item").update({"quantity": updated_stock_quantity}).eq("stock_item_id", stock_item_id).execute()

            # 5. Update expiration quantity or delete if zero
            updated_expiration_quantity = expiration_quantity - quantity_to_dispose

            # Update expiration quantity
            supabase.table("Expiration").update({"quantity": updated_expiration_quantity}).eq("expiration_id", expiration_id).execute()

            return Response({"message": "Disposal recorded and quantities updated"}, status=200)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def delete(self, request, expiration_id):
        try:
            response = supabase.table("Expiration").delete().eq('expiration_id', expiration_id).execute()

            if response.data:
                return Response({"message": "Expiration deleted successfully"}, status=204)
            else:
                return Response({"error": "Expiration not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
