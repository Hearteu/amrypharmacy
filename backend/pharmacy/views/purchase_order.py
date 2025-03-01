# views.py

import re
from datetime import datetime

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
                "purchase_order_id, po_id, order_date, expected_delivery_date, purchase_order_status_id, notes, "
                "Purchase_Order_Item (purchase_order_item_id, poi_id, ordered_quantity, purchase_order_item_status_id, unit_id, Unit (unit), "
                "Purchase_Order_Item_Status (po_item_status), "
                "Supplier_Item (supplier_item_id, supplier_price, "
                "Products (product_name, Drugs (dosage_form, dosage_strength)), "
                "Supplier (supplier_name, Person (first_name, last_name, contact, email, address))))"
            )

            if purchase_order_id is not None:
                query = query.eq("purchase_order_id", purchase_order_id).single()

            response = query.execute()

            if not response.data:
                return Response({"error": "No purchase orders found"}, status=404)

            purchase_orders = [response.data] if isinstance(response.data, dict) else response.data
            formatted_orders = []

            for order in purchase_orders:
                purchase_order_items = order.get("Purchase_Order_Item", [])

                # Extract supplier details from the first line item (assuming all items belong to the same supplier)
                supplier_item = purchase_order_items[0].get("Supplier_Item", {}) if purchase_order_items else {}
                supplier_data = supplier_item.get("Supplier", {})
                person_data = supplier_data.get("Person", {})

                formatted_order = {
                    "purchase_order_id": order["purchase_order_id"],
                    "po_id": order["po_id"],
                    "supplier": {
                        "name": supplier_data.get("supplier_name", "Unknown Supplier"),
                        "contact": f"{person_data.get('first_name', '')} {person_data.get('last_name', '')}".strip(),
                        "email": person_data.get("email", "N/A"),
                        "phone": person_data.get("contact", "N/A"),
                        "address": person_data.get("address", "N/A"),
                    },
                    "order_date": order["order_date"],
                    "expected_date": order["expected_delivery_date"],
                    "po_total": 0,  # Calculate below
                    "status_id": order["purchase_order_status_id"],
                    "status": purchase_order_items[0].get("Purchase_Order_Item_Status", {}).get("po_item_status", "Unknown"),
                    "notes": order["notes"],
                    "lineItems": [],
                }

                po_total = 0
                for item in purchase_order_items:
                    supplier_item = item.get("Supplier_Item", {})  # Avoid KeyError
                    product = supplier_item.get("Products", {})
                    drugs = product.get("Drugs", {})

                    # Concatenate dosage info if the product is a drug
                    dosage_info = f" {drugs.get('dosage_form', '')} {drugs.get('dosage_strength', '')}" if drugs else ""
                    product_name = f"{product.get('product_name', 'Unknown Product')}{dosage_info}"

                    supplier_price = supplier_item.get("supplier_price", 0)
                    poi_total = item["ordered_quantity"] * supplier_price
                    po_total += poi_total

                    formatted_order["lineItems"].append({
                        "purchase_order_item_id": item["purchase_order_item_id"],
                        "poi_id": item.get("poi_id", ""),
                        "description": product_name,  # ✅ Includes dosage info if it's a drug
                        "quantity": item["ordered_quantity"],
                        "supplier_price": supplier_price,
                        "poi_total": poi_total,  # ✅ Renamed total → poi_total
                        "purchase_order_item_status": item["purchase_order_item_status_id"],
                        "po_item_status": item.get("Purchase_Order_Item_Status", {}).get("po_item_status", "Unknown"),  # ✅ Added po_item_status
                        "unit_id": item.get("unit_id", "N/A"),
                        "unit": item.get("Unit", {}).get("unit", "N/A"),
                    })

                formatted_order["po_total"] = po_total  # ✅ Renamed total → po_total
                formatted_orders.append(formatted_order)

            return Response(formatted_orders if purchase_order_id is None else formatted_orders[0], status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        """Create a new Purchase Order with line items"""
        try:
            data = request.data
            print(f"🟢 Received request data: {data}")  # Debugging input

            # Get the current year
            current_year = datetime.now().year

            # Fetch the latest po_id for the current year
            latest_order_query = supabase.table("Purchase_Order").select("po_id") \
                .like("po_id", f"PO-{current_year}-%") \
                .order("po_id", desc=True) \
                .limit(1) \
                .execute()

            # Determine the next sequence number for po_id
            if latest_order_query.data:
                latest_order_id = latest_order_query.data[0]["po_id"]
                last_number = int(latest_order_id.split("-")[-1])  # Extract last number
                next_number = f"{last_number + 1:03d}"  # Increment and format as 3 digits
            else:
                next_number = "001"  # Start with 001 if no previous orders exist

            # Generate the new po_id
            po_id = f"PO-{current_year}-{next_number}"
            purchase_order_suffix = po_id.split("-")[-1]  # Extract the numeric part

            order_date = datetime.fromisoformat(data["order_date"]).strftime("%Y-%m-%d")
            expected_delivery_date = datetime.fromisoformat(data["expected_delivery_date"]).strftime("%Y-%m-%d")

            # ✅ Insert into Purchase_Order
            order_insert = supabase.table("Purchase_Order").insert({
                "po_id": po_id,
                "order_date": order_date,
                "expected_delivery_date": expected_delivery_date,
                "purchase_order_status_id": 1,
                "notes": data.get("notes", None)
            }).execute()

            if hasattr(order_insert, "error") and order_insert.error:
                print(f"❌ Error inserting Purchase Order: {order_insert.error}")
                return Response({"error": str(order_insert.error)}, status=500)

            purchase_order_id = order_insert.data[0]["purchase_order_id"]
            print(f"🟢 Purchase Order Created: ID={purchase_order_id}, Custom PO ID={po_id}")  # Debugging

            supplier_id = data["supplier_id"]  # ✅ Needed for querying Supplier_Item
            print(f"🟢 Supplier ID: {supplier_id}")  # Debugging

            # ✅ Insert line items
            purchase_order_items = []
            for index, item in enumerate(data["lineItems"], start=1):
                print(f"🔹 Processing Line Item {index}: {item}")  # Debugging

                # Fetch supplier item details
                supplier_item_query = supabase.table("Supplier_Item").select(
                    "supplier_item_id, supplier_price"
                ).eq("product_id", item["product_id"]).eq("supplier_id", supplier_id).single().execute()

                if hasattr(supplier_item_query, "error") and supplier_item_query.error:
                    print(f"❌ Error fetching Supplier_Item: {supplier_item_query.error}")  # Debugging
                    continue

                if not supplier_item_query.data:
                    print(f"⚠️ No Supplier_Item found for product_id {item['product_id']} and supplier_id {supplier_id}")
                    continue

                supplier_item = supplier_item_query.data
                print(f"🟢 Found Supplier_Item: {supplier_item}")  # Debugging

                # Fetch the latest poi_id for this purchase order
                latest_item_query = supabase.table("Purchase_Order_Item").select("poi_id") \
                    .like("poi_id", f"POI-{purchase_order_suffix}-%") \
                    .order("poi_id", desc=True) \
                    .limit(1) \
                    .execute()

                # Determine the next sequence number for poi_id
                if latest_item_query.data:
                    latest_poi_id = latest_item_query.data[0]["poi_id"]
                    last_poi_match = re.search(r"-(\d+)$", latest_poi_id)
                    last_poi_number = int(last_poi_match.group(1)) if last_poi_match else 0
                    next_poi_number = f"{last_poi_number + 1:02d}"
                else:
                    next_poi_number = "01"

                # Generate new poi_id
                poi_id = f"POI-{purchase_order_suffix}-{next_poi_number}"

                purchase_order_items.append({
                    "poi_id": poi_id,
                    "purchase_order_id": purchase_order_id,
                    "supplier_item_id": supplier_item["supplier_item_id"],
                    "ordered_quantity": item["ordered_quantity"],
                    "unit_id": item["unit_id"],
                    "purchase_order_item_status_id": 1,
                })

            print(f"🟢 Total Line Items to Insert: {len(purchase_order_items)}")  # Debugging

            if purchase_order_items:
                item_insert = supabase.table("Purchase_Order_Item").insert(purchase_order_items).execute()

                if hasattr(item_insert, "get") and item_insert.get("error"):
                    print(f"❌ Error inserting Purchase Order Items: {item_insert.get('error')}")
                    return Response({"error": str(item_insert.get('error'))}, status=500)

                print(f"🟢 Successfully inserted {len(purchase_order_items)} items into Purchase_Order_Item.")

                return Response({"message": "Purchase Order created successfully", "po_id": po_id}, status=201)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
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
