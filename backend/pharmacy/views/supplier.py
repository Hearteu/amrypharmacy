from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Supplier(APIView):
    def get(self, request, supplier_id=None):
        try:
            query = supabase.table("Supplier").select(
                "supplier_id, supplier_name, vat_num, status_id, Status(status), person_id, Person(first_name, last_name, contact, email, address)"
            )

            if supplier_id is not None:
                query = query.eq("supplier_id", supplier_id)

            response = query.execute()

            if not response.data:
                return Response({"error": "No supplier found"}, status=404)

            # Process response for all suppliers
            if supplier_id is None:
                suppliers = [
                    {
                        "supplier_id": item["supplier_id"],
                        "supplier_name": item["supplier_name"],
                        "contact_person": f"{item['Person']['first_name']} {item['Person']['last_name']}",
                        "contact": item["Person"]["contact"],
                        "email": item["Person"]["email"],
                        "address": item["Person"]["address"],
                        "vat_num": item["vat_num"],
                        "status": item["Status"]["status"],  # Returning status name for list
                        # "status_id": item["status_id"],  # Returning status_id for list
                    }
                    for item in response.data
                ]
                return Response(suppliers, status=200)

            # Process response for a specific supplier
            item = response.data[0]
            supplier = {
                "supplier_id": item["supplier_id"],
                "supplier_name": item["supplier_name"],
                "first_name": item["Person"]["first_name"],
                "last_name": item["Person"]["last_name"],
                "contact": item["Person"]["contact"],
                "email": item["Person"]["email"],
                "address": item["Person"]["address"],
                "vat_num": item["vat_num"],
                "status_id": item["status_id"],
            }
            return Response(supplier, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    
    def post(self, request):
        try:
            data = request.data

            # Insert into Person table
            person_response = supabase.table("Person").insert({
                "first_name": data.get("first_name"),
                "last_name": data.get("last_name"),
                "contact": data.get("contact"),
                "email": data.get("email"),
                "address": data.get("address")
            }).execute()

            if not person_response.data:
                return Response({"error": "Failed to create person"}, status=400)

            person_id = person_response.data[0]["person_id"]

            # Insert into Supplier table
            supplier_response = supabase.table("Supplier").insert({
                "supplier_name": data.get("supplier_name"),
                "vat_num": data.get("vat_num"),
                "status_id": data.get("status_id"),
                "person_id": person_id
            }).execute()

            if not supplier_response.data:
                return Response({"error": "Failed to create supplier"}, status=400)

            return Response({"message": "Supplier created successfully", "supplier": supplier_response.data[0]}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

        
    def put(self, request, supplier_id=None):
        try:
            data = request.data

            if supplier_id is None:
                return Response({"error": "Supplier ID is required"}, status=400)

            # Check if supplier exists
            supplier_response = supabase.table("Supplier").select("person_id").eq("supplier_id", supplier_id).execute()

            if not supplier_response.data:
                return Response({"error": "Supplier not found"}, status=404)

            person_id = supplier_response.data[0]["person_id"]


            # Update Person table
            person_update = {
                "first_name": data.get("first_name"),
                "last_name": data.get("last_name"),
                "contact": data.get("contact"),
                "email": data.get("email"),
                "address": data.get("address")
            }
            supabase.table("Person").update(person_update).eq("person_id", person_id).execute()

            # Update Supplier table
            supplier_update = {
                "supplier_name": data.get("supplier_name"),
                "vat_num": data.get("vat_num"),
                "status_id": data.get("status_id")
            }
            supabase.table("Supplier").update(supplier_update).eq("supplier_id", supplier_id).execute()

            return Response({"message": "Supplier updated successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

        
    # HARD DELETE
    def delete(self, request, supplier_id=None):
        try:
            if supplier_id is None:
                return Response({"error": "Supplier ID is required"}, status=400)

            # Check if supplier exists
            supplier_response = supabase.table("Supplier").select("person_id").eq("supplier_id", supplier_id).execute()

            if not supplier_response.data:
                return Response({"error": "Supplier not found"}, status=404)

            person_id = supplier_response.data[0]["person_id"]

            # Delete supplier record
            supabase.table("Supplier").delete().eq("supplier_id", supplier_id).execute()

            # Delete associated person record
            supabase.table("Person").delete().eq("person_id", person_id).execute()

            return Response({"message": "Supplier deleted successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    # SOFT DELETE
    # def delete(self, request, supplier_id=None):
    #     try:
    #         if supplier_id is None:
    #             return Response({"error": "Supplier ID is required"}, status=400)

    #         # Check if supplier exists
    #         supplier_response = supabase.table("Supplier").select("supplier_id").eq("supplier_id", supplier_id).execute()

    #         if not supplier_response.data:
    #             return Response({"error": "Supplier not found"}, status=404)

    #         # Soft delete by setting status_id to False
    #         supabase.table("Supplier").update({"status_id": False}).eq("supplier_id", supplier_id).execute()

    #         return Response({"message": "Supplier deactivated successfully"}, status=200)

    #     except Exception as e:
    #         return Response({"error": str(e)}, status=500)


               

