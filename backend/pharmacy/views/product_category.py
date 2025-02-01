# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class ProductCategory(APIView):
    def get(self, request):
        response = supabase.table('Product_Category').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)
        
    def post(self, request):
        data = request.data 
        try:
           
            response = supabase.table("Product_Category").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
    def put(self, request, category_id):
        data = request.data 
        try:
            response = supabase.table("Product_Category").update(data).eq('category_id', category_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Category not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, category_id):
        try:
            response = supabase.table("Product_Category").delete().eq('category_id', category_id).execute()

            if response.data:
                return Response({"message": "Category deleted successfully"}, status=204)
            else:
                return Response({"error": "Category not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
