# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Drugs(APIView):
    def get(self, request, drugs_id=None):
        try:
            query = supabase.table('Drugs').select('*')
            if drugs_id is not None:
                query = query.eq('drugs_id', drugs_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No Drugs found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
       
        
    def post(self, request):
        data = request.data
        
        # Extract product-related fields and remove them from `data`
        product_fields = ["brand_id", "category_id", "product_name", "current_price", "net_content"]
        product_data = {key: data.pop(key, None) for key in product_fields}

        try:
            # Insert into Products table first (if needed)
            product_response = supabase.table("Products").insert(product_data).execute()
                
            if not product_response.data:
                return Response({"error": "Products insertion failed"}, status=400)
                
            # Retrieve the generated products_id
            products_id = product_response.data[0]["products_id"]
            data["products_id"] = products_id  # Assign to the Drugs entry

            # Insert into Drugs table
            drugs_response = supabase.table("Drugs").insert(data).execute()

            if not drugs_response.data:
                return Response({"error": "Drugs insertion failed"}, status=400)

            # Insert into Inventory table (products_id must be available)
            inventory_data = {"products_id": data["products_id"]}  
            supabase.table("Inventory").insert(inventory_data).execute()

            return Response(drugs_response.data, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)


    def put(self, request, drugs_id):
        data = request.data 
        try:
            response = supabase.table("Drugs").update(data).eq('drugs_id', drugs_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Drugs not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, drugs_id):
        try:
            response = supabase.table("Drugs").delete().eq('drugs_id', drugs_id).execute()

            if response.data:
                return Response({"message": "Drugs deleted successfully"}, status=204)
            else:
                return Response({"error": "Drugs not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
