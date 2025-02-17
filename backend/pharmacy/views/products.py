# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Products(APIView):
    def get(self, request, products_id=None):
        try:
            query = supabase.table('Products').select('*')
            if products_id is not None:
                query = query.eq('products_id', products_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No Products found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
       
        
    def post(self, request):
        data = request.data
        print(data)
        try:
            product_response = supabase.table("Products").insert(data).execute()

            if not product_response.data:
                return Response({"error": "Products insertion failed"}, status=400)

            # Get the generated products_id
            products_id = product_response.data[0]["products_id"]

            # Insert the products_id into the Inventory table with other fields as NULL
            inventory_data = {"products_id": products_id}  # Other columns remain NULL
            supabase.table("Inventory").insert(inventory_data).execute()

            return Response(product_response.data, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

 
    def put(self, request, products_id):
        data = request.data 
        try:
            response = supabase.table("Products").update(data).eq('products_id', products_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Products not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, products_id):
        try:
            response = supabase.table("Products").delete().eq('products_id', products_id).execute()

            if response.data:
                return Response({"message": "Products deleted successfully"}, status=204)
            else:
                return Response({"error": "Products not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
