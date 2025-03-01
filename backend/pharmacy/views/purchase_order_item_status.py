# views.py

import re
from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Purchase_Order_Item_Status(APIView):
    def get(self, request, purchase_order_item_status_id=None):
        try:
            query = supabase.table('Purchase_Order_Item_Status').select('*')
            if purchase_order_item_status_id is not None:
                query = query.eq('purchase_order_item_status_id', purchase_order_item_status_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No Purchase_Order_Item_Status found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    def post(self, request):
        data = request.data
        try:
           
            response = supabase.table("Purchase_Order_Item_Status").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, purchase_order_item_status_id):
        data = request.data 
        try:
            response = supabase.table("Purchase_Order_Item_Status").update(data).eq('purchase_order_item_status_id', purchase_order_item_status_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Purchase_Order_Item_Status not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, purchase_order_item_status_id):
        try:
            response = supabase.table("Purchase_Order_Item_Status").delete().eq('purchase_order_item_status_id', purchase_order_item_status_id).execute()

            if response.data:
                return Response({"message": "Purchase_Order_Item_Status deleted successfully"}, status=204)
            else:
                return Response({"error": "Purchase_Order_Item_Status not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)