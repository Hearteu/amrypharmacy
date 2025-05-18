# views.py

import traceback
from datetime import datetime
import time

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
 
    def put(self, request, expiration_id):
        data = request.data 
        try:
            response = supabase.table("Expiration").update(data).eq('expiration_id', expiration_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Expiration not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, expiration_id):
        try:
            response = supabase.table("Expiration").delete().eq('expiration_id', expiration_id).execute()

            if response.data:
                return Response({"message": "Expiration deleted successfully"}, status=204)
            else:
                return Response({"error": "Expiration not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
