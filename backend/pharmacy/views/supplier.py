from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Supplier(APIView):
    def get(self, request, supplier_id=None):
        try:
            query = supabase.table("Supplier").select("supplier_id, company_name, vat_num, is_active, person_id (first_name, last_name, contact, email, address)")

            if supplier_id is not None:
                query = query.eq("supplier_id", supplier_id)

            response = query.execute()

            if not response.data:
                return Response({"error": "No supplier found"}, status=404)

            # Process response based on single/multiple suppliers
            if supplier_id is None:
                suppliers = [
                    {
                        "supplier_id": item["supplier_id"],
                        "company_name": item["company_name"],
                        "contact_person": f"{item['person_id']['first_name']} {item['person_id']['last_name']}",
                        "contact": item["person_id"]["contact"],
                        "email": item["person_id"]["email"],
                        "address": item["person_id"]["address"],
                        "vat_num": item["vat_num"],
                        "is_active": item["is_active"],
                    }
                    for item in response.data
                ]
                return Response(suppliers, status=200)

            item = response.data[0]
            supplier = {
                "supplier_id": item["supplier_id"],
                "company_name": item["company_name"],
                "first_name": item["person_id"]["first_name"],
                "last_name": item["person_id"]["last_name"],
                "contact": item["person_id"]["contact"],
                "email": item["person_id"]["email"],
                "address": item["person_id"]["address"],
                "vat_num": item["vat_num"],
                "is_active": item["is_active"],
            }
            return Response(supplier, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    def post(self, request):
        try:
            data = request.data

            # Extract Person Data
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            contact = data.get("contact")
            email = data.get("email")
            address = data.get("address")

            # Insert into Person table
            person_response = supabase.table("Person").insert({
                "first_name": first_name,
                "last_name": last_name,
                "contact": contact,
                "email": email,
                "address": address
            }).execute()

            if not person_response.data:
                return Response({"error": "Failed to create person"}, status=400)

            person_id = person_response.data[0]["person_id"]

            # Extract Supplier Data
            company_name = data.get("company_name")
            vat_num = data.get("vat_num")
            is_active = data.get("is_active")

            # Insert into Supplier table
            supplier_response = supabase.table("Supplier").insert({
                "company_name": company_name,
                "vat_num": vat_num,
                "is_active": is_active,
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

            # If only is_active is provided (ignoring supplier_id), update only that field
            # for dropdown is_active update
            if set(data.keys()) == {"supplier_id", "is_active"} or set(data.keys()) == {"is_active"}:
                supabase.table("Supplier").update({"is_active": data["is_active"]}).eq("supplier_id", supplier_id).execute()
                return Response({"message": "Supplier status updated successfully"}, status=200)

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
                "company_name": data.get("company_name"),
                "vat_num": data.get("vat_num"),
            }
            supabase.table("Supplier").update(supplier_update).eq("supplier_id", supplier_id).execute()

            return Response({"message": "Supplier updated successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
        
    def delete(self, request, supplier_id):
        try:
            response = supabase.table("Supplier").delete().eq('supplier_id', supplier_id).execute()

            if response.data:
                return Response({"message": "Supplier deleted successfully"}, status=204)
            else:
                return Response({"error": "Supplier not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
               

