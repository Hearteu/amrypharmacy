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
            branch = request.query_params.get('branch')  # Treated as location_id

            query = supabase.table('Stock_Item').select('*')

            if threshold is not None:
                query = query.lt('quantity', int(threshold))

            if branch is not None:
                query = query.eq('location_id', int(branch))

            response = query.execute()
            if not response.data:
                return Response({"error": "No low stock items found"}, status=404)

            stock_items = response.data
            product_ids = list(set(item['product_id'] for item in stock_items))
            location_ids = list(set(item['location_id'] for item in stock_items))

            # Fetch Products
            products_resp = supabase.table('Products').select('product_id, product_name, current_price, category_id, brand_id').in_('product_id', product_ids).execute()
            product_map = {prod['product_id']: prod for prod in products_resp.data}

            # Fetch Drugs
            drugs_resp = supabase.table('Drugs').select('product_id, dosage_form, dosage_strength').in_('product_id', product_ids).execute()
            drug_map = {drug['product_id']: drug for drug in drugs_resp.data}

            # Fetch Categories
            category_ids = list(set(prod['category_id'] for prod in products_resp.data if prod.get('category_id')))
            categories_resp = supabase.table('Product_Category').select('category_id, category_name').in_('category_id', category_ids).execute()
            category_map = {
                cat['category_id']: cat['category_name'].strip() if cat.get('category_name') else None
                for cat in categories_resp.data
            }

            # Fetch Brands
            brand_ids = list(set(prod['brand_id'] for prod in products_resp.data if prod.get('brand_id')))
            brands_resp = supabase.table('Brand').select('brand_id, brand_name').in_('brand_id', brand_ids).execute()
            brand_map = {brand['brand_id']: brand['brand_name'] for brand in brands_resp.data}

            # Fetch Locations
            locations_resp = supabase.table('Location').select('location_id, location').in_('location_id', location_ids).execute()
            location_map = {loc['location_id']: loc['location'] for loc in locations_resp.data}

            formatted_items = []
            for item in stock_items:
                product = product_map.get(item['product_id'], {})
                drugs = drug_map.get(item['product_id'], {})
                location_name = location_map.get(item['location_id'], 'Unknown Location')

                dosage_parts = []
                if drugs.get('dosage_form'):
                    dosage_parts.append(drugs['dosage_form'])
                if drugs.get('dosage_strength'):
                    dosage_parts.append(drugs['dosage_strength'])
                dosage = ' '.join(dosage_parts)
                full_name = f"{product.get('product_name', 'Unknown Product')} {dosage}".strip()

                product_details = {
                    "product_id": item["product_id"],
                    "full_product_name": full_name,
                    "current_price": product.get("current_price"),
                    "category_id": product.get("category_id"),
                    "category_name": category_map.get(product.get("category_id")),
                    "brand_id": product.get("brand_id"),
                    "brand_name": brand_map.get(product.get("brand_id"))
                }

                formatted_items.append({
                    "product_id": item["product_id"],
                    "product_id": item["product_id"],
                    "location_id": item["location_id"],
                    "location_name": location_name,
                    "quantity": item["quantity"],
                    "product_details": product_details
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
 
    # def put(self, request, product_id):
    #     data = request.data
    #     try:
    #         # Convert location_id to an integer
    #         location_id = int(data.get("location_id", 0))

    #         # Update the stock item directly in one query
    #         response = supabase.table("Stock_Item").update({
    #             "quantity": data["quantity"]
    #         }) \
    #         .eq("product_id", product_id) \
    #         .eq("location_id", location_id) \
    #         .execute()

    #         if response.data:
    #             return Response(response.data, status=200)
    #         else:
    #             return Response({"error": "Stock_Item not found or update failed"}, status=404)

    #     except ValueError:
    #         return Response({"error": "Invalid location_id format"}, status=400)
    #     except Exception as e:
    #         return Response({"error": str(e)}, status=400)

    def put(self, request, product_id):
        data = request.data
        location_id = int(data.get("location_id"))
        product_id = data.get("product_id")
        quantity = data.get("quantity")
        transaction_type = data.get("transaction_type")

        try:
            quantity = int(quantity)

            # 1. Get current stock quantity and src_location
            stock_response = supabase.table("Stock_Item").select("quantity").eq("product_id", product_id).single().execute()
            if not stock_response.data:
                return Response({"error": "Stock item not found"}, status=404)

            current_quantity = int(stock_response.data["quantity"])

            # 3. Insert stock transaction with src_location
            transaction_data = {
                "product_id": product_id,
                "transaction_type": transaction_type,
                "quantity_change": current_quantity - quantity,
                "src_location": location_id
            }
            supabase.table("Stock_Transaction").insert(transaction_data).execute()

            # 4. Update stock item quantity
            supabase.table("Stock_Item").update({"quantity": quantity}).eq("product_id", product_id).eq("location_id", location_id).execute()

            return Response({"message": "Disposal recorded and quantities updated"}, status=200)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

   
    def delete(self, request, product_id):
        try:
            response = supabase.table("Stock_Item").delete().eq('product_id', product_id).execute()

            if response.data:
                return Response({"message": "Stock_Item deleted successfully"}, status=204)
            else:
                return Response({"error": "Stock_Item not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
