# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Brand(APIView):
    def get(self, request, brand_id=None):
        try:
            query = supabase.table('Brand').select('*')
            if brand_id is not None:
                query = query.eq('brand_id', brand_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No brand found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    def post(self, request):
        data = request.data
        try:
            response = supabase.table("Brand").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, brand_id):
        data = request.data
        try:
            response = supabase.table("Brand").update(data).eq('brand_id', brand_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Category not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, brand_id):
        try:
            response = supabase.table("Brand").delete().eq('brand_id', brand_id).execute()

            if response.data:
                return Response({"message": "Category deleted successfully"}, status=204)
            else:
                return Response({"error": "Category not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
