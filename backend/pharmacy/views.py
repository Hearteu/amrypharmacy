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
 
class UserList(APIView):
    def get(self, request):
        supabase = get_supabase_client()
        response = supabase.table('Users').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)       

