# views.py

from datetime import datetime, timedelta

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class StockItem(APIView):
    def get(self, request):
        try:
            threshold = request.query_params.get('threshold')
            query = supabase.table('Stock_Item').select('*')

            if threshold is not None:
                query = query.lt('quantity', int(threshold))

            response = query.execute()
            if not response.data:
                return Response({"error": "No low stock items found"}, status=404)

            stock_items = response.data
            product_ids = list(set(item['product_id'] for item in stock_items))

            # Fetch Products
            products_resp = supabase.table('Products').select('product_id, product_name').in_('product_id', product_ids).execute()
            product_map = {prod['product_id']: prod for prod in products_resp.data}

            # Fetch Drugs
            drugs_resp = supabase.table('Drugs').select('product_id, dosage_form, dosage_strength').in_('product_id', product_ids).execute()
            drug_map = {drug['product_id']: drug for drug in drugs_resp.data}

            formatted_items = []
            for item in stock_items:
                product = product_map.get(item['product_id'], {})
                drugs = drug_map.get(item['product_id'], {})

                dosage = f"{drugs.get('dosage_form', '')} {drugs.get('dosage_strength', '')}".strip()
                full_name = f"{product.get('product_name', 'Unknown Product')} {dosage}".strip()

                formatted_items.append({
                    "stock_item_id": item["stock_item_id"],
                    "product_id": item["product_id"],
                    "location_id": item["location_id"],
                    "quantity": item["quantity"],
                    "full_product_name": full_name
                })

            return Response(formatted_items, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


    def post(self, request):
        data = request.data
        try:
           
            response = supabase.table("Stock_Item").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, product_id):
        data = request.data
        try:
            # Convert location_id to an integer
            location_id = int(data.get("location_id", 0))

            # Update the stock item directly in one query
            response = supabase.table("Stock_Item").update({
                "quantity": data["quantity"]
            }) \
            .eq("product_id", product_id) \
            .eq("location_id", location_id) \
            .execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Stock_Item not found or update failed"}, status=404)

        except ValueError:
            return Response({"error": "Invalid location_id format"}, status=400)
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
