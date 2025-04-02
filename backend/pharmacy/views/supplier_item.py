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
                "Products (product_id, product_name, unit_id, Drugs (dosage_form, dosage_strength))"
            )

            if supplier_id is not None:
                query = query.eq("supplier_id", supplier_id)

            response = query.execute()

            if not response.data or not isinstance(response.data, list):
                return Response({"error": "No supplier items found"}, status=404)

            # Process response safely
            supplier_items = []
            for item in response.data:
                product_name = item.get("Products", {}).get("product_name", "")

                # Check if the product has drug details
                if item.get("Products") and item["Products"].get("Drugs"):
                    dosage_form = item["Products"]["Drugs"].get("dosage_form", "")
                    dosage_strength = item["Products"]["Drugs"].get("dosage_strength", "")

                    # Concatenate dosage_form and dosage_strength if they exist
                    if dosage_form or dosage_strength:
                        product_name += f" {dosage_form} {dosage_strength}"

                supplier_item = {
                    "supplier_item_id": item.get("supplier_item_id"),
                    "supplier_id": item.get("Supplier", {}).get("supplier_id"),
                    "supplier_name": item.get("Supplier", {}).get("supplier_name"),
                    "product_id": item.get("Products", {}).get("product_id"),
                    "product_name": product_name,  # Updated with concatenated values
                    "unit_id": item.get("Products", {}).get("unit_id"),
                    "supplier_price": item.get("supplier_price"),
                }

                supplier_items.append(supplier_item)

            return Response(supplier_items, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


    def post(self, request):
        try:
            data = request.data
            supplier_id = data.get("supplier_id")
            product_id = data.get("product_id")
            supplier_price = data.get("supplier_price")

            response = supabase.table("Supplier_Item").insert({
                "supplier_id": supplier_id,
                "product_id": product_id,
                "supplier_price": supplier_price
            }).execute()

            if not response.data or not isinstance(response.data, list):
                return Response({"error": "Failed to add supplier item"}, status=400)

            return Response({
                "message": "Supplier item added successfully",
                "supplier_item": response.data[0]
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def put(self, request, supplier_item_id=None):
        try:
            if supplier_item_id is None:
                return Response({"error": "Supplier Item ID is required"}, status=400)

            data = request.data
            supplier_item_response = supabase.table("Supplier_Item").select("*").eq("supplier_item_id", supplier_item_id).execute()

            if not supplier_item_response.data or not isinstance(supplier_item_response.data, list):
                return Response({"error": "Supplier item not found"}, status=404)

            update_data = {
                "supplier_id": data.get("supplier_id"),
                "product_id": data.get("product_id"),
                "supplier_price": data.get("supplier_price"),
            }
            update_data = {k: v for k, v in update_data.items() if v is not None}

            supabase.table("Supplier_Item").update(update_data).eq("supplier_item_id", supplier_item_id).execute()

            return Response({"message": "Supplier item updated successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def delete(self, request, supplier_item_id=None):
        try:
            if supplier_item_id is None:
                return Response({"error": "Supplier Item ID is required"}, status=400)

            supplier_item_response = supabase.table("Supplier_Item").select("supplier_item_id").eq("supplier_item_id", supplier_item_id).execute()

            if not supplier_item_response.data or not isinstance(supplier_item_response.data, list):
                return Response({"error": "Supplier item not found"}, status=404)

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


               

