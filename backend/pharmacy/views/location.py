# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Location(APIView):
    def get(self, request, location_id=None):
        try:
            query = supabase.table('Location').select('*')
            if location_id is not None:
                query = query.eq('location_id', location_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No Location found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    def post(self, request):
        data = request.data 
        try:
           
            response = supabase.table("Location").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, location_id):
        data = request.data
        try:
            response = supabase.table("Location").update(data).eq('location_id', location_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Location not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, location_id):
        try:
            response = supabase.table("Location").delete().eq('location_id', location_id).execute()

            if response.data:
                return Response({"message": "Location deleted successfully"}, status=204)
            else:
                return Response({"error": "Location not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
