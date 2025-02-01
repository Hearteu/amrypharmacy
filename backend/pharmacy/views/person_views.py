# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class PersonList(APIView):
    def get(self, request):
        response = supabase.table('Person').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)
        
    def post(self, request):
        print(request.data)
        return Response(request.data)
        person_data = request.data 
        try:
            # Insert into persons table
            person = supabase.table("Person").insert(person_data).execute()
            return Response(person.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        
    def put(self, request, person_id):
        person_data = request.data 
        try:
            # Update the person in the database based on person_id
            response = supabase.table("Person").update(person_data).eq('person_id', person_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Person not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    # change this to hide instead of delete soon
    def delete(self, request, person_id):
        try:
            # Delete the person from the database based on person_id
            response = supabase.table("Person").delete().eq('person_id', person_id).execute()

            if response.data:
                return Response({"message": "Person deleted successfully"}, status=204)
            else:
                return Response({"error": "Person not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
