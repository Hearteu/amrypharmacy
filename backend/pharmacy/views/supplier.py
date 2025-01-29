from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Supplier(APIView):
    def get(self, request):
        response = supabase.table('Supplier').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)
    
    def post(self, request):
        supplier_data = request.data 
        try:
            response = supabase.table("Supplier").insert(supplier_data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
    def put(self, request, supplier_id):
        supplier_data = request.data 
        try:
            response = supabase.table("Supplier").update(supplier_data).eq('supplier_id', supplier_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Supplier not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    # change this to hide instead of delete soon
    def delete(self, request, supplier_id):
        try:
            response = supabase.table("Supplier").delete().eq('supplier_id', supplier_id).execute()

            if response.data:
                return Response({"message": "Supplier deleted successfully"}, status=204)
            else:
                return Response({"error": "Supplier not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
               

