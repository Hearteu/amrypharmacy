# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Products(APIView):
    def get(self, request, product_id=None):
        try:
            query = supabase.table('Product').select('*')
            if product_id is not None:
                query = query.eq('product_id', product_id)
            
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
            # Insert product into Product table
            product_response = supabase.table("Product").insert(data).execute()

            if not product_response.data:
                return Response({"error": "Product insertion failed"}, status=400)

            # Get the generated product_id
            product_id = product_response.data[0]["product_id"]

            # Insert the product_id into the Inventory table with other fields as NULL
            inventory_data = {"product_id": product_id}  # Other columns remain NULL
            supabase.table("Inventory").insert(inventory_data).execute()

            return Response(product_response.data, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

 
    def put(self, request, product_id):
        data = request.data 
        try:
            response = supabase.table("Product").update(data).eq('product_id', product_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Product not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, product_id):
        try:
            response = supabase.table("Product").delete().eq('product_id', product_id).execute()

            if response.data:
                return Response({"message": "Product deleted successfully"}, status=204)
            else:
                return Response({"error": "Product not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
