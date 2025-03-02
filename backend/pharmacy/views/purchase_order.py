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
                "Supplier_Item (supplier_id, supplier_item_id, supplier_price, "
                "Products (product_id, product_name, Drugs (dosage_form, dosage_strength)), "
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

                # ✅ Ensure purchase_order_items exists before accessing index 0
                supplier_item = {}
                supplier_data = {}
                person_data = {}

                if purchase_order_items:
                    supplier_item = purchase_order_items[0].get("Supplier_Item", {})
                    supplier_data = supplier_item.get("Supplier", {})
                    person_data = supplier_data.get("Person", {})

                formatted_order = {
                    "purchase_order_id": order["purchase_order_id"],
                    "po_id": order["po_id"],
                    "supplier": {
                        "supplier_id": supplier_item.get("supplier_id", "N/A"),
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
                    "status": "Unknown" if not purchase_order_items else purchase_order_items[0].get("Purchase_Order_Item_Status", {}).get("po_item_status", "Unknown"),
                    "notes": order["notes"],
                    "lineItems": [],
                }

                po_total = 0
                for item in purchase_order_items:
                    supplier_item = item.get("Supplier_Item", {})  # Avoid KeyError
                    product = supplier_item.get("Products", {})
                    drugs = product.get("Drugs", {}) if "Drugs" in product else {}  # ✅ Fix for non-drug products
                    product_id = product.get("product_id", "N/A")

                    # ✅ Concatenate dosage info only if available
                    dosage_info = f" {drugs.get('dosage_form', '')} {drugs.get('dosage_strength', '')}".strip() if drugs else ""
                    product_name = f"{product.get('product_name', 'Unknown Product')}{dosage_info}"

                    supplier_price = supplier_item.get("supplier_price", 0)
                    poi_total = item["ordered_quantity"] * supplier_price
                    po_total += poi_total

                    formatted_order["lineItems"].append({
                        "purchase_order_item_id": item["purchase_order_item_id"],
                        "poi_id": item.get("poi_id", ""),
                        "product_id": product_id,
                        "description": product_name,  # ✅ Includes dosage info if it's a drug
                        "quantity": item["ordered_quantity"],
                        "supplier_price": supplier_price,
                        "poi_total": poi_total,  # ✅ Renamed total → poi_total
                        "purchase_order_item_status": item["purchase_order_item_status_id"],
                        "po_item_status": item.get("Purchase_Order_Item_Status", {}).get("po_item_status", "Unknown"),
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

            # Determine the next sequence number for purchase_order_id
            if latest_order_query.data:
                latest_order_id = latest_order_query.data[0]["po_id"]
                last_number = int(latest_order_id.split("-")[-1])  # Extract last number
                next_number = f"{last_number + 1:03d}"  # Increment and format as 3 digits
            else:
                next_number = "001"  # Start with 001 if no previous orders exist

            # Generate the new po_id
            po_id = f"PO-{current_year}-{next_number}"
            purchase_order_suffix = po_id.split("-")[-1]

            order_date = datetime.fromisoformat(data["order_date"]).strftime("%Y-%m-%d")
            expected_delivery_date = datetime.fromisoformat(data["expected_delivery_date"]).strftime("%Y-%m-%d")

            # ✅ Insert into Purchase_Order **WITHOUT supplier_id**
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

            supplier_id = data["supplier_id"]  # ✅ Just for querying Supplier_Item
            print(f"🟢 Supplier ID: {supplier_id}")  # Debugging

            # ✅ Fetch latest POI suffix (so we don't query every time)
            latest_item_query = supabase.table("Purchase_Order_Item").select("poi_id") \
                .like("poi_id", f"POI-{purchase_order_suffix}-%") \
                .order("poi_id", desc=True) \
                .limit(1) \
                .execute()

            if latest_item_query.data:
                latest_poi_id = latest_item_query.data[0]["poi_id"]
                last_poi_match = re.search(r"-(\d+)$", latest_poi_id)
                last_poi_number = int(last_poi_match.group(1)) if last_poi_match else 0
            else:
                last_poi_number = 0  # No previous items exist

            # ✅ Insert line items
            purchase_order_items = []
            for index, item in enumerate(data["lineItems"], start=1):
                print(f"🔹 Processing Line Item {index}: {item}")  # Debugging

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

                # ✅ Increment poi_id properly using counter
                last_poi_number += 1
                next_poi_number = f"{last_poi_number:02d}"
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

                # Check if item_insert has errors properly
                if hasattr(item_insert, "get") and item_insert.get("error"):
                    print(f"❌ Error inserting Purchase Order Items: {item_insert.get('error')}")
                    return Response({"error": str(item_insert.get('error'))}, status=500)

                # ✅ Debugging success
                print(f"🟢 Successfully inserted {len(purchase_order_items)} items into Purchase_Order_Item.")

                return Response({"message": "Purchase Order created successfully", "po_id": po_id}, status=201)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)

    def put(self, request, purchase_order_id=None):
        """Update an existing purchase order and sync line items (update, add new, remove missing)"""
        try:
            data = request.data
            print(f"🟢 Received update data: {data}")  # Debugging input

            # ✅ Update Purchase Order
            update_data = {
                "expected_delivery_date": data.get("expected_delivery_date"),
                "purchase_order_status_id": data.get("purchase_order_status_id")
            }

            if update_data.get("expected_delivery_date"):
                update_data["expected_delivery_date"] = datetime.fromisoformat(update_data["expected_delivery_date"]).strftime("%Y-%m-%d")

            update_data = {key: value for key, value in update_data.items() if value is not None}

            if update_data:
                response = supabase.table("Purchase_Order").update(update_data).eq("purchase_order_id", purchase_order_id).execute()
                if not response.data:
                    return Response({"error": "Purchase order not found or not updated"}, status=404)

            # ✅ Handle Line Items
            if "lineItems" in data and isinstance(data["lineItems"], list):
                purchase_order_suffix = data.get("po_id", "").split("-")[-1]  # Extract suffix from PO ID

                # Get existing PO Items for this order
                existing_items_query = supabase.table("Purchase_Order_Item").select("poi_id").eq("purchase_order_id", purchase_order_id).execute()
                existing_poi_ids = {item["poi_id"] for item in existing_items_query.data} if existing_items_query.data else set()

                # ✅ Process line items (update existing, insert new)
                new_items = []
                updated_poi_ids = set()
                for item in data["lineItems"]:
                    poi_id = item.get("poi_id")

                    if poi_id:
                        updated_poi_ids.add(poi_id)  # Track updated items

                        # ✅ Update existing PO Item
                        item_update_data = {
                            "ordered_quantity": item.get("ordered_quantity"),
                            "purchase_order_item_status_id": item.get("purchase_order_item_status_id")
                        }
                        item_update_data = {k: v for k, v in item_update_data.items() if v is not None}

                        if item_update_data:
                            supabase.table("Purchase_Order_Item").update(item_update_data).eq("poi_id", poi_id).execute()
                    else:
                        # ✅ Insert new PO Item
                        last_poi_number = len(existing_poi_ids) + len(new_items) + 1  # Increment dynamically
                        new_poi_id = f"POI-{purchase_order_suffix}-{last_poi_number:02d}"

                        supplier_item_query = supabase.table("Supplier_Item").select("supplier_item_id, supplier_price") \
                            .eq("product_id", item["product_id"]).eq("supplier_id", data["supplier_id"]).single().execute()

                        if supplier_item_query.data:
                            supplier_item = supplier_item_query.data
                            new_items.append({
                                "poi_id": new_poi_id,
                                "purchase_order_id": purchase_order_id,
                                "supplier_item_id": supplier_item["supplier_item_id"],
                                "ordered_quantity": item["ordered_quantity"],
                                "unit_id": item["unit_id"],
                                "purchase_order_item_status_id": 1
                            })

                # ✅ Delete missing items
                items_to_delete = existing_poi_ids - updated_poi_ids
                if items_to_delete:
                    supabase.table("Purchase_Order_Item").delete().in_("poi_id", list(items_to_delete)).execute()
                    print(f"🗑️ Deleted PO Items: {items_to_delete}")

                # ✅ Bulk insert new items
                if new_items:
                    supabase.table("Purchase_Order_Item").insert(new_items).execute()

            return Response({"message": "Purchase order updated successfully"}, status=200)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
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
