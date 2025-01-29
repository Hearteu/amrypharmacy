# views.py

from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from .supabase_client import get_supabase_client


class PersonList(APIView):
    def get(self, request):
        supabase = get_supabase_client()
        response = supabase.table('Person').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)
        
    def post(self, request):
        person_data = request.json()  # Expecting name, address, contact, email
        try:
            # Insert into persons table
            supabase = get_supabase_client()
            person = supabase.table("Person").insert(person_data).execute()
            return JsonResponse(person.data, status=201, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
        
    def put(self, request, person_id):
        person_data = request.json()  # Expecting fields to update, like name, address, contact, etc.
        try:
            # Update the person in the database based on person_id
            supabase = get_supabase_client()
            response = supabase.table("Person").update(person_data).eq('person_id', person_id).execute()

            if response.data:
                return JsonResponse(response.data, status=200, safe=False)
            else:
                return JsonResponse({"error": "Person not found or update failed"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    def delete(self, request, person_id):
        try:
            # Delete the person from the database based on person_id
            supabase = get_supabase_client()
            response = supabase.table("Person").delete().eq('person_id', person_id).execute()

            if response.data:
                return JsonResponse({"message": "Person deleted successfully"}, status=204)
            else:
                return JsonResponse({"error": "Person not found or deletion failed"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
 
class UserList(APIView):
    def get(self, request):
        supabase = get_supabase_client()
        response = supabase.table('Users').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)       

