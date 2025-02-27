# views.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class PurchaseOrder(APIView):
    def get(self, request, purchase_order_id=None):
        """Retrieve all purchase orders or a single purchase order by ID with lineItems"""
        try:
            query = supabase.table("Purchase_Order").select(
                "purchase_order_id, order_date, expected_delivery_date, "
                "purchase_order_status_id, notes, "
                "Purchase_Order_Item (purchase_order_item_id, supplier_item_id, ordered_quantity, purchase_order_item_status_id, "
                "Purchase_Order_Item_Status (purchase_order_item_status_id, po_item_status), "
                "Supplier_Item (product_id, supplier_price, Products (product_id, product_name, unit_id, Drugs (dosage_form, dosage_strength)), "
                "Supplier (supplier_id, supplier_name)))"
            )

            if purchase_order_id is not None:
                query = query.eq("purchase_order_id", purchase_order_id).single()

            response = query.execute()

            if not response.data:
                return Response({"error": "No purchase orders found"}, status=404)

            purchase_orders = [response.data] if isinstance(response.data, dict) else response.data

            formatted_orders = []
            for order in purchase_orders:
                # Get supplier details from the first lineItem (assuming all items belong to the same supplier)
                first_item = order.get("Purchase_Order_Item", [{}])[0]
                supplier = first_item.get("Supplier_Item", {}).get("Supplier", {})

                formatted_order = {
                    "purchase_order_id": order["purchase_order_id"],
                    "supplier_id": supplier.get("supplier_id"),  
                    "supplier_name": supplier.get("supplier_name"),  
                    "order_date": order["order_date"],
                    "expected_delivery_date": order["expected_delivery_date"],
                    "purchase_order_status_id": order["purchase_order_status_id"],
                    "notes": order["notes"],
                    "lineItems": []
                }

                if "Purchase_Order_Item" in order and isinstance(order["Purchase_Order_Item"], list):
                    for item in order["Purchase_Order_Item"]:
                        supplier_item = item.get("Supplier_Item", {})  
                        product = supplier_item.get("Products", {})  # FIX: Changed `Product` to `Products`
                        drugs = product.get("Drugs", {})  

                        # If the product is a drug, append its dosage details to the product name
                        dosage_info = f" {drugs['dosage_form']} {drugs['dosage_strength']}" if drugs else ""
                        product_name = f"{product.get('product_name', '')}{dosage_info}"

                        formatted_order["lineItems"].append({
                            "product_id": product.get("product_id"),  # FIX: From `Products`
                            "product_name": product_name,
                            "unit_id": product.get("unit_id"),  # FIX: From `Products`
                            "ordered_quantity": item["ordered_quantity"],
                            "supplier_price": supplier_item.get("supplier_price"),
                            "purchase_order_item_status_id": item.get("purchase_order_item_status_id"),
                            "po_item_status": item.get("Purchase_Order_Item_Status", {}).get("po_item_status", "Unknown")  
                        })

                formatted_orders.append(formatted_order)

            return Response(formatted_orders if purchase_order_id is None else formatted_orders[0], status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


    def put(self, request, purchase_order_id):
        """Update an existing purchase order"""
        try:
            data = request.data

            update_data = {
                "supplier_id": data.get("supplier_id"),
                "expected_delivery_date": data.get("expected_delivery_date"),
                "status": data.get("status")
            }

            update_data = {key: value for key, value in update_data.items() if value is not None}

            if not update_data:
                return Response({"error": "No fields provided for update"}, status=400)

            response = supabase.table("Purchase_Order").update(update_data).eq("purchase_order_id", purchase_order_id).execute()

            if not response.data:
                return Response({"error": "Purchase order not found or not updated"}, status=404)

            return Response({"message": "Purchase order updated successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def delete(self, request, purchase_order_id):
        """Delete a purchase order"""
        try:
            response = supabase.table("Purchase_Order").delete().eq("purchase_order_id", purchase_order_id).execute()

            if not response.data:
                return Response({"error": "Purchase order not found"}, status=404)

            return Response({"message": "Purchase order deleted successfully"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
