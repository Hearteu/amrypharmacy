# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class PurchaseOrder(APIView):
    def get(self, request, purchase_order_id=None):
        try:
            query = supabase.table('Purchase_Order').select('*')
            if purchase_order_id is not None:
                query = query.eq('purchase_order_id', purchase_order_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No Purchase Order found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    def post(self, request):
        data = request.data 
        try:
           
            response = supabase.table("Purchase_Order").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, purchase_order_id):
        data = request.data 
        try:
            response = supabase.table("Purchase_Order").update(data).eq('purchase_order_id', purchase_order_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Purchase Order not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, purchase_order_id):
        try:
            response = supabase.table("Purchase_Order").delete().eq('purchase_order_id', purchase_order_id).execute()

            if response.data:
                return Response({"message": "Purchase Order deleted successfully"}, status=204)
            else:
                return Response({"error": "Purchase Order not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
