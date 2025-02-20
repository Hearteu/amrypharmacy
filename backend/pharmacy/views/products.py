# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Products(APIView):
    def get(self, request, product_id=None):
        # Base query
        query = supabase.table("Products").select(
            "product_id, product_name, current_price, net_content, "
            "Brand(brand_id, brand_name), Product_Category(category_id, category_name), "
            "Unit(unit_id, unit), Drugs(dosage_strength, dosage_form)"
        )

        # If a specific product_id is provided, filter the query
        if product_id:
            query = query.eq("product_id", product_id)

        # Execute query
        response = query.execute()
        products = response.data

        if product_id:
            # If product_id is provided, return a single product
            if not products:
                return Response({"error": "Product not found"}, status=404)

            product = products[0]  # Get the first (and only) result
            drug_info = product.get("Drugs", {})

            # Check if it's a drug
            if isinstance(drug_info, dict) and drug_info:
                return Response({
                    "product_id": product.get("product_id"),
                    "product_name": product.get("product_name", "").strip(),
                    "category_id": product.get("Product_Category", {}).get("category_id"),
                    "brand_id": product.get("Brand", {}).get("brand_id"),
                    "current_price": product.get("current_price", 0),
                    "dosage_strength": drug_info.get("dosage_strength", "").strip(),
                    "dosage_form": drug_info.get("dosage_form", "").strip(),
                    "net_content": product.get("net_content", "").strip(),
                    "unit_id": product.get("Unit", {}).get("unit_id")
                })
            else:
                return Response({
                    "product_id": product.get("product_id"),
                    "product_name": product.get("product_name", "").strip(),
                    "category_id": product.get("Product_Category", {}).get("category_id"),
                    "brand_id": product.get("Brand", {}).get("brand_id"),
                    "current_price": product.get("current_price", 0),
                    "net_content": product.get("net_content", "").strip(),
                    "unit_id": product.get("Unit", {}).get("unit_id")
                })

        # If no product_id is provided, return the list
        formatted_products = []
        for product in products:
            brand_name = product.get("Brand", {}).get("brand_name", "").strip()
            category_name = product.get("Product_Category", {}).get("category_name", "").strip()
            unit_name = product.get("Unit", {}).get("unit", "").strip()
            drug_info = product.get("Drugs", {})

            # Check if it's a drug (exists in Drugs table and has data)
            if isinstance(drug_info, dict) and drug_info:
                dosage_strength = drug_info.get("dosage_strength", "").strip()
                dosage_form = drug_info.get("dosage_form", "").strip()
                full_name = f"{product['product_name']} {dosage_strength} {dosage_form} {brand_name}"
            else:
                full_name = f"{product['product_name']} {product['net_content']} per {unit_name} ({brand_name})"

            formatted_products.append({
                "product_id": product.get("product_id"),
                "full_product_name": full_name,
                "category": category_name,
                "price": product["current_price"],
                "net_content": product["net_content"],
                "unit": unit_name
            })

        return Response(formatted_products)
       
        
    def post(self, request):
        data = request.data
        print(data)

        try:
            # Insert into Products table
            product_response = supabase.table("Products").insert({
                "product_name": data["product_name"],
                "category_id": data["category_id"],
                "brand_id": data["brand_id"],
                "current_price": data["current_price"],
                "net_content": data["net_content"],
                "unit_id": data["unit_id"]
            }).execute()

            if not product_response.data:
                return Response({"error": "Products insertion failed"}, status=400)

            # Get the generated product_id
            product_id = product_response.data[0]["product_id"]

            # Check if it's a drug (has dosage_strength and dosage_form)
            if "dosage_strength" in data and "dosage_form" in data:
                drug_response = supabase.table("Drugs").insert({
                    "product_id": product_id,  # FK to Products
                    "dosage_strength": data["dosage_strength"],
                    "dosage_form": data["dosage_form"]
                }).execute()

                if not drug_response.data:
                    return Response({"error": "Drugs insertion failed"}, status=400)

            return Response({"message": "Product added successfully", "product": product_response.data}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

 
    def put(self, request, product_id=None):
        data = request.data
        print(data)
        try:
            # Update the Products table
            product_response = supabase.table("Products").update({
                "product_name": data["product_name"],
                "category_id": data["category_id"],
                "brand_id": data["brand_id"],
                "current_price": data["current_price"],
                "net_content": data["net_content"],
                "unit_id": data["unit_id"]
            }).eq("product_id", product_id).execute()

            if not product_response.data:
                return Response({"error": "Product not found or update failed"}, status=400)

            # Check if it's a drug (has dosage_strength and dosage_form)
            if "dosage_strength" in data and "dosage_form" in data:
                # Check if the drug entry already exists
                drug_check = supabase.table("Drugs").select("product_id").eq("product_id", product_id).execute()

                if drug_check.data:
                    # Update existing drug entry
                    drug_response = supabase.table("Drugs").update({
                        "dosage_strength": data["dosage_strength"],
                        "dosage_form": data["dosage_form"]
                    }).eq("product_id", product_id).execute()
                else:
                    # Insert new drug entry if it doesn't exist
                    drug_response = supabase.table("Drugs").insert({
                        "product_id": product_id,
                        "dosage_strength": data["dosage_strength"],
                        "dosage_form": data["dosage_form"]
                    }).execute()

                if not drug_response.data:
                    return Response({"error": "Drugs update failed"}, status=400)

            return Response({"message": "Product updated successfully", "product": product_response.data}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
   
    def delete(self, request, product_id=None):
        data = request.data
        print(data)
        
        try:
            # Check if the product exists
            product_check = supabase.table("Products").select("product_id").eq("product_id", product_id).execute()
            if not product_check.data:
                return Response({"error": "Product not found"}, status=404)

            # Check if the product exists in the Drugs table
            drug_check = supabase.table("Drugs").select("product_id").eq("product_id", product_id).execute()

            if drug_check.data:
                # Delete from Drugs table first
                supabase.table("Drugs").delete().eq("product_id", product_id).execute()

            # Delete from Products table
            response = supabase.table("Products").delete().eq("product_id", product_id).execute()

            if response.data:
                return Response({"message": "Product deleted successfully"}, status=200)
            else:
                return Response({"error": "Product deletion failed"}, status=400)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

