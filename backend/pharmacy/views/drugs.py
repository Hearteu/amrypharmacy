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
        print(data)
        try:
            product_response = supabase.table("Drugs").insert(data).execute()

            if not product_response.data:
                return Response({"error": "Drugs insertion failed"}, status=400)

            # Get the generated drugs_id
            drugs_id = product_response.data[0]["drugs_id"]

            # Insert the drugs_id into the Inventory table with other fields as NULL
            inventory_data = {"drugs_id": drugs_id}  # Other columns remain NULL
            supabase.table("Inventory").insert(inventory_data).execute()

            return Response(product_response.data, status=201)

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
