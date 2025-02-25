from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class SupplierItem(APIView):
    def get(self, request, supplier_id=None):
        try:
            query = supabase.table("Supplier_Item").select(
                "supplier_item_id, supplier_price, "
                "Supplier (supplier_id, supplier_name), "
                "Products (product_id, product_name)"
            )

            if supplier_id is not None:
                query = query.eq("Supplier.supplier_id", supplier_id)

            response = query.execute()

            if not response.data:
                return Response({"error": "No supplier items found"}, status=404)

            # Process response for all items of the specific supplier
            supplier_items = [
                {
                    "supplier_item_id": item["supplier_item_id"],
                    "supplier_id": item["Supplier"]["supplier_id"],
                    "supplier_name": item["Supplier"]["supplier_name"],
                    "product_id": item["Products"]["product_id"],
                    "product_name": item["Products"]["product_name"],
                    "supplier_price": item["supplier_price"],
                }
                for item in response.data
            ]
            return Response(supplier_items, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


    def post(self, request):
        try:
            data = request.data

            # Extract data
            supplier_id = data.get("supplier_id")
            product_id = data.get("product_id")
            supplier_price = data.get("supplier_price")

            # Insert into Supplier_Item table
            response = supabase.table("Supplier_Item").insert({
                "supplier_id": supplier_id,
                "product_id": product_id,
                "supplier_price": supplier_price
            }).execute()

            if not response.data:
                return Response({"error": "Failed to add supplier item"}, status=400)

            return Response({"message": "Supplier item added successfully", "supplier_item": response.data[0]}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


        
    def put(self, request, supplier_item_id=None):
        try:
            data = request.data

            if supplier_item_id is None:
                return Response({"error": "Supplier Item ID is required"}, status=400)

            # Check if supplier item exists
            supplier_item_response = supabase.table("Supplier_Item").select("*").eq("supplier_item_id", supplier_item_id).execute()

            if not supplier_item_response.data:
                return Response({"error": "Supplier item not found"}, status=404)

            # Update Supplier_Item table
            update_data = {
                "supplier_id": data.get("supplier_id"),
                "product_id": data.get("product_id"),
                "supplier_price": data.get("supplier_price"),
            }

            # Remove None values (fields not included in the request)
            update_data = {key: value for key, value in update_data.items() if value is not None}

            supabase.table("Supplier_Item").update(update_data).eq("supplier_item_id", supplier_item_id).execute()

            return Response({"message": "Supplier item updated successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


        
    def delete(self, request, supplier_item_id=None):
        try:
            if supplier_item_id is None:
                return Response({"error": "Supplier Item ID is required"}, status=400)

            # Check if supplier item exists
            supplier_item_response = supabase.table("Supplier_Item").select("supplier_item_id").eq("supplier_item_id", supplier_item_id).execute()

            if not supplier_item_response.data:
                return Response({"error": "Supplier item not found"}, status=404)

            # Delete the supplier item
            supabase.table("Supplier_Item").delete().eq("supplier_item_id", supplier_item_id).execute()

            return Response({"message": "Supplier item deleted successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    
    # SOFT DELETE
    # def delete(self, request, supplier_item_id=None):
    #     try:
    #         if supplier_item_id is None:
    #             return Response({"error": "Supplier ID is required"}, status=400)

    #         # Check if supplier exists
    #         supplier_response = supabase.table("Supplier").select("supplier_item_id").eq("supplier_item_id", supplier_item_id).execute()

    #         if not supplier_response.data:
    #             return Response({"error": "Supplier not found"}, status=404)

    #         # Soft delete by setting product_id to False
    #         supabase.table("Supplier").update({"product_id": False}).eq("supplier_item_id", supplier_item_id).execute()

    #         return Response({"message": "Supplier deactivated successfully"}, status=200)

    #     except Exception as e:
    #         return Response({"error": str(e)}, status=500)


               

