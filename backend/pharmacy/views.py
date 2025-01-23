# views.py

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
