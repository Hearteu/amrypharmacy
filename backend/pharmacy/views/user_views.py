# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class UserList(APIView):
    def get(self, request):
        response = supabase.table('Users').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)
    
    def post(self, request):
        user_data = request.data 
        try:
            user = supabase.table("Users").insert(user_data).execute()
            return Response(user.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
    def put(self, request, user_id):
        user_data = request.data 
        try:
            response = supabase.table("Users").update(user_data).eq('user_id', user_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Users not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    # change this to hide instead of delete soon
    def delete(self, request, user_id):
        try:
            response = supabase.table("Users").delete().eq('user_id', user_id).execute()

            if response.data:
                return Response({"message": "Users deleted successfully"}, status=204)
            else:
                return Response({"error": "Users not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
               

