# views.py

from datetime import datetime, timedelta

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class StockTransfer(APIView):
    def get(self, request, stock_transfer_id=None):
        """Retrieve all stock transfers or a single stock transfer by ID with transferItems (filtered by expiry date)"""
        try:
            query = supabase.table("Stock_Transfer").select(
                "stock_transfer_id, transfer_id, transfer_date, stock_transfer_status_id, "
                "Stock_Transfer_Status!inner(stock_transfer_status), "
                "src_location, src_location_data:Location!src_location(location), "  # Source Location
                "des_location, des_location_data:Location!des_location(location), "  # Destination Location
                "Stock_Transfer_Item (stock_transfer_item_id, sti_id, ordered_quantity, stock_transfer_item_status_id, "
                "unit_id, transferred_qty, product_id, Unit (unit), "
                "Products (product_name, Drugs (dosage_strength, dosage_form)))"
            )

            if stock_transfer_id is not None:
                query = query.eq("stock_transfer_id", stock_transfer_id).single()

            response = query.execute()

            if not response.data:
                return Response({"error": "No stock transfers found"}, status=404)

            stock_transfers = [response.data] if isinstance(response.data, dict) else response.data
            formatted_transfers = []

            # Collect product_ids to fetch stock quantities and expiry dates
            product_ids = {
                item["product_id"]
                for transfer in stock_transfers
                for item in (transfer.get("Stock_Transfer_Item") or [])
                if item.get("product_id") is not None
            }

            # Fetch stock quantities from Stock_Item table
            stock_items = {}
            if product_ids:
                stock_response = supabase.table("Stock_Item").select("product_id, quantity").in_("product_id", list(product_ids)).execute()
                if stock_response.data:
                    stock_items = {item["product_id"]: item["quantity"] for item in stock_response.data}

            # Fetch expiry dates from POI table for products with POI transactions
            expiry_dates = {}
            if product_ids:
                stock_txns = supabase.table("Stock_Transaction").select("product_id, transaction_type, reference_id") \
                    .in_("product_id", list(product_ids)) \
                    .execute()

                poi_references = {
                    txn["reference_id"]
                    for txn in stock_txns.data
                    if txn["transaction_type"] == "POI" and txn.get("reference_id")
                }

                if poi_references:
                    poi_response = supabase.table("POI").select("poi_id, expiry_date").in_("poi_id", list(poi_references)).execute()
                    if poi_response.data:
                        expiry_dates = {
                            poi["poi_id"]: datetime.strptime(poi["expiry_date"], "%Y-%m-%d")
                            for poi in poi_response.data
                        }

            six_months_later = datetime.now() + timedelta(days=180)  # 6 months from today

            for transfer in stock_transfers:
                stock_transfer_items = transfer.get("Stock_Transfer_Item") or []

                formatted_transfer = {
                    "stock_transfer_id": transfer["stock_transfer_id"],
                    "transfer_id": transfer["transfer_id"],
                    "transfer_date": transfer["transfer_date"],
                    "status_id": transfer["stock_transfer_status_id"],
                    "status": (transfer.get("Stock_Transfer_Status") or {}).get("stock_transfer_status", "Unknown"),
                    "src_location_id": transfer.get("src_location"),
                    "src_location_name": (transfer.get("src_location_data") or {}).get("location", "Unknown"),
                    "des_location_id": transfer.get("des_location"),
                    "des_location_name": (transfer.get("des_location_data") or {}).get("location", "Unknown"),
                    "transferItems": [],
                }

                for item in stock_transfer_items:
                    product_id = item.get("product_id")
                    stock_quantity = stock_items.get(product_id, 0) if product_id is not None else 0
                    product = item.get("Products") or {}
                    product_name = product.get("product_name", "Unknown")
                    drug = product.get("Drugs") or {}

                    if drug:
                        product_name += f" {drug.get('dosage_form', '')} {drug.get('dosage_strength', '')}".strip()

                    # Get expiry date
                    expiry_date = None
                    stock_txn = next((txn for txn in stock_txns.data if txn["product_id"] == product_id), None)
                    if stock_txn and stock_txn["transaction_type"] == "POI":
                        expiry_date = expiry_dates.get(stock_txn["reference_id"])

                    # ✅ Only include items that expire 6 months or later
                    if expiry_date and expiry_date < six_months_later:
                        print(f"⚠️ Product {product_id} expires on {expiry_date}. Skipping...")
                        continue  # Skip items expiring too soon

                    formatted_transfer["transferItems"].append({
                        "stock_transfer_item_id": item["stock_transfer_item_id"],
                        "sti_id": item.get("sti_id", ""),
                        "product_id": product_id if product_id is not None else 0,
                        "product_name": product_name,
                        "ordered_quantity": item["ordered_quantity"],
                        "transferred_qty": item.get("transferred_qty", 0),
                        "stock_transfer_item_status_id": item.get("stock_transfer_item_status_id", "Unknown"),
                        "unit_id": item.get("unit_id", "N/A"),
                        "unit": (item.get("Unit") or {}).get("unit", "N/A"),
                        "current_stock_quantity": stock_quantity,
                        "expiry_date": expiry_date.strftime("%Y-%m-%d") if expiry_date else "N/A"
                    })

                formatted_transfers.append(formatted_transfer)

            return Response(formatted_transfers if stock_transfer_id is None else formatted_transfers[0], status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


    def post(self, request):
        """Create a new stock transfer with items"""
        try:
            data = request.data
            print(f"🟢 Submitted Data: {data}")  # Debugging input

            src_location = data.get("src_location_id")  # ✅ Use correct key
            des_location = data.get("des_location_id")  # ✅ Use correct key
            transfer_date = data.get("transfer_date")
            items = data.get("transferItems", [])  # ✅ Use correct key

            # Generate transfer_id (ST-YYYY-XXX)
            year = datetime.now().year
            last_transfer = supabase.table("Stock_Transfer").select("transfer_id").order("transfer_id", desc=True).limit(1).execute()
            next_number = 1
            if last_transfer.data:
                last_id = last_transfer.data[0]["transfer_id"]
                last_number = int(last_id.split("-")[-1])
                next_number = last_number + 1
            transfer_id = f"ST-{year}-{str(next_number).zfill(3)}"

            # ✅ Insert into Stock_Transfer
            stock_transfer = {
                "transfer_id": transfer_id,
                "transfer_date": transfer_date,
                "stock_transfer_status_id": 1,
                "src_location": src_location,
                "des_location": des_location
            }
            response = supabase.table("Stock_Transfer").insert(stock_transfer).execute()
            if not response.data:
                return Response({"error": "Failed to create stock transfer"}, status=400)
            stock_transfer_id = response.data[0]["stock_transfer_id"]

            # ✅ Insert items into Stock_Transfer_Item
            for idx, item in enumerate(items, start=1):
                sti_id = f"STI-{transfer_id.split('-')[-1]}-{str(idx).zfill(2)}"  # ✅ Use consistent STI format
                stock_transfer_item = {
                    "stock_transfer_id": stock_transfer_id,
                    "sti_id": sti_id,
                    "product_id": item["product_id"],
                    "ordered_quantity": item["ordered_quantity"],  # ✅ Correct key
                    "stock_transfer_item_status_id": 1,
                    "unit_id": item.get("unit_id")
                }
                supabase.table("Stock_Transfer_Item").insert(stock_transfer_item).execute()

            return Response({"message": "Stock transfer created successfully", "transfer_id": transfer_id}, status=201)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)

 
    # def put(self, request, stock_transfer_id):
    #     """Update an existing stock transfer and handle transfer items correctly."""
    #     try:
    #         data = request.data
    #         print(f"🟢 Received update data: {data}")  # Debugging input

    #         # ✅ If only `stock_transfer_status_id` is provided, update only the status
    #         if set(data.keys()) == {"stock_transfer_status_id"}:
    #             update_response = supabase.table("Stock_Transfer") \
    #                 .update({"stock_transfer_status_id": data["stock_transfer_status_id"]}) \
    #                 .eq("stock_transfer_id", stock_transfer_id) \
    #                 .execute()

    #             if not update_response.data:
    #                 return Response({"error": "Stock transfer not found or not updated"}, status=404)

    #             print(f"✅ Updated Stock Transfer Status: {update_response}")
    #             return Response({"message": "Stock transfer status updated successfully"}, status=200)

    #         # ✅ Fetch Transfer ID for suffix
    #         stock_transfer_query = supabase.table("Stock_Transfer").select("transfer_id") \
    #             .eq("stock_transfer_id", stock_transfer_id).single().execute()
    #         transfer_id = stock_transfer_query.data["transfer_id"] if stock_transfer_query.data else None

    #         if not transfer_id:
    #             return Response({"error": "Transfer ID not found"}, status=404)

    #         # 🔹 Extract last three digits of Transfer ID for suffix
    #         transfer_suffix = transfer_id[-3:]
    #         print(f"🔹 Transfer Suffix: {transfer_suffix}")

    #         # ✅ Update Stock Transfer if necessary
    #         update_data = {
    #             "src_location": data.get("src_location"),
    #             "des_location": data.get("des_location"),
    #             "transfer_date": data.get("transfer_date"),
    #             "stock_transfer_status_id": data.get("stock_transfer_status_id"),
    #         }
    #         update_data = {key: value for key, value in update_data.items() if value is not None}

    #         if update_data:
    #             response = supabase.table("Stock_Transfer").update(update_data) \
    #                 .eq("stock_transfer_id", stock_transfer_id).execute()
    #             if not response.data:
    #                 return Response({"error": "Stock transfer not found or not updated"}, status=404)

    #         # ✅ Process Transfer Items
    #         if "transferItems" in data and isinstance(data["transferItems"], list):
    #             # 🔍 Get existing items in the database
    #             existing_items_query = supabase.table("Stock_Transfer_Item") \
    #                 .select("sti_id, product_id") \
    #                 .eq("stock_transfer_id", stock_transfer_id) \
    #                 .execute()

    #             existing_items = {str(item["product_id"]): item["sti_id"] for item in existing_items_query.data}
    #             print(f"🔍 Existing Items in DB: {existing_items}")

    #             # 🔍 Extract product IDs from the request
    #             passed_product_ids = {str(item["product_id"]) for item in data["transferItems"]}
    #             print(f"🔍 Passed Product IDs: {passed_product_ids}")

    #             # ✅ Ensure no None values & correct types before deleting
    #             items_to_delete = [sti_id for product_id, sti_id in existing_items.items() if product_id not in passed_product_ids and sti_id]

    #             if items_to_delete:
    #                 print(f"❌ Deleting STIs: {items_to_delete}")
                    
    #                 delete_response = supabase.table("Stock_Transfer_Item").delete().in_("sti_id", list(map(str, items_to_delete))).execute()

    #                 print(f"✅ Deleted Items Response: {delete_response}")

    #             # 🔍 Check remaining items after deletion
    #             remaining_items_check = supabase.table("Stock_Transfer_Item") \
    #                 .select("sti_id") \
    #                 .eq("stock_transfer_id", stock_transfer_id) \
    #                 .execute()
    #             print(f"🔍 Remaining Items After Deletion: {remaining_items_check.data}")

    #             # 🔹 Get latest STI number after deletion
    #             latest_sti_query = supabase.table("Stock_Transfer_Item") \
    #                 .select("sti_id") \
    #                 .like("sti_id", f"STI-{transfer_suffix}-%") \
    #                 .order("sti_id", desc=True) \
    #                 .limit(1) \
    #                 .execute()

    #             last_sti_number = int(latest_sti_query.data[0]["sti_id"].split("-")[-1]) if latest_sti_query.data else 0
    #             print(f"🔹 Last STI Number after deletion: {last_sti_number}")

    #             # ✅ Process transfer items (update existing & insert new)
    #             new_items = []
    #             for item in data["transferItems"]:
    #                 product_id = str(item["product_id"])
    #                 sti_id = existing_items.get(product_id)  # Check if it exists

    #                 if sti_id:
    #                     # ✅ Update existing Stock Transfer Item
    #                     item_update_data = {
    #                         "ordered_quantity": item.get("ordered_quantity"),
    #                         "transferred_qty": item.get("transferred_qty", 0),
    #                         "stock_transfer_item_status_id": item.get("stock_transfer_item_status_id"),
    #                         "unit_id": item.get("unit_id"),
    #                     }
    #                     item_update_data = {k: v for k, v in item_update_data.items() if v is not None}

    #                     if item_update_data:
    #                         update_response = supabase.table("Stock_Transfer_Item") \
    #                             .update(item_update_data) \
    #                             .eq("sti_id", sti_id) \
    #                             .execute()
    #                         print(f"✅ Updated STI {sti_id}: {update_response}")

    #                 else:
    #                     # ✅ Insert new Stock Transfer Item
    #                     last_sti_number += 1  # Increment for new item
    #                     new_sti_id = f"STI-{transfer_suffix}-{last_sti_number:02d}"

    #                     new_items.append({
    #                         "sti_id": new_sti_id,
    #                         "stock_transfer_id": stock_transfer_id,
    #                         "product_id": item["product_id"],
    #                         "ordered_quantity": item["ordered_quantity"],
    #                         "stock_transfer_item_status_id": 1,
    #                         "unit_id": item.get("unit_id"),
    #                         "transferred_qty": item.get("transferred_qty", 0),
    #                     })
    #                     print(f"➕ New STI ID: {new_sti_id}")

    #             # ✅ Bulk insert new items
    #             if new_items:
    #                 insert_response = supabase.table("Stock_Transfer_Item").insert(new_items).execute()
    #                 print(f"✅ Inserted New Items: {insert_response}")

    #         return Response({"message": "Stock transfer updated successfully"}, status=200)

    #     except Exception as e:
    #         print(f"❌ Exception: {str(e)}")  # Debugging
    #         return Response({"error": str(e)}, status=500)


    def put(self, request, stock_transfer_id):
        """Update an existing stock transfer and handle transfer items correctly."""
        try:
            data = request.data
            print(f"🟢 Received update data: {data}")

            # ✅ If only `stock_transfer_status_id` is provided, update only the status
            if set(data.keys()) == {"stock_transfer_status_id"}:
                update_response = supabase.table("Stock_Transfer") \
                    .update({"stock_transfer_status_id": data["stock_transfer_status_id"]}) \
                    .eq("stock_transfer_id", stock_transfer_id) \
                    .execute()

                if not update_response.data:
                    return Response({"error": "Stock transfer not found or not updated"}, status=404)

                print(f"✅ Updated Stock Transfer Status: {update_response}")

                # ✅ If status is "Completed", update all stock transfer items and handle stock movement
                if data["stock_transfer_status_id"] == 4:
                    # Update all stock transfer items to completed
                    supabase.table("Stock_Transfer_Item").update({"stock_transfer_item_status_id": 4}) \
                        .eq("stock_transfer_id", stock_transfer_id).execute()
                    
                    # Fetch stock transfer details
                    transfer_query = supabase.table("Stock_Transfer").select("src_location, des_location") \
                        .eq("stock_transfer_id", stock_transfer_id).single().execute()
                    transfer_data = transfer_query.data
                    
                    if not transfer_data:
                        return Response({"error": "Stock transfer locations not found"}, status=404)
                    
                    src_location = transfer_data["src_location"]
                    des_location = transfer_data["des_location"]
                    
                    # Fetch stock transfer items
                    items_query = supabase.table("Stock_Transfer_Item").select("product_id, transferred_qty") \
                        .eq("stock_transfer_id", stock_transfer_id).execute()
                    items = items_query.data or []
                    
                    for item in items:
                        product_id = item["product_id"]
                        qty = item["transferred_qty"]
                        
                        # Deduct from source location
                        supabase.table("Stock_Item").update({"quantity": supabase.raw("quantity - " + str(qty))}) \
                            .eq("product_id", product_id).eq("location_id", src_location).execute()
                        
                        # Add to destination location
                        supabase.table("Stock_Item").update({"quantity": supabase.raw("quantity + " + str(qty))}) \
                            .eq("product_id", product_id).eq("location_id", des_location).execute()
                        
                        # Insert into Stock_Transaction
                        supabase.table("Stock_Transaction").insert({
                            "product_id": product_id,
                            "stock_transfer_id": stock_transfer_id,
                            "quantity": qty,
                            "transaction_type": "Transfer",
                            "src_location": src_location,
                            "des_location": des_location,
                            "transaction_date": datetime.utcnow().isoformat()
                        }).execute()
                    
                    return Response({"message": "Stock transfer and items marked as completed, stock updated."}, status=200)

                return Response({"message": "Stock transfer status updated successfully"}, status=200)

            # ✅ Fetch Transfer ID for suffix
            stock_transfer_query = supabase.table("Stock_Transfer").select("transfer_id") \
                .eq("stock_transfer_id", stock_transfer_id).single().execute()
            transfer_id = stock_transfer_query.data["transfer_id"] if stock_transfer_query.data else None

            if not transfer_id:
                return Response({"error": "Transfer ID not found"}, status=404)

            # 🔹 Extract last three digits of Transfer ID for suffix
            transfer_suffix = transfer_id[-3:]
            print(f"🔹 Transfer Suffix: {transfer_suffix}")

            # ✅ Update Stock Transfer if necessary
            update_data = {
                "src_location": data.get("src_location"),
                "des_location": data.get("des_location"),
                "transfer_date": data.get("transfer_date"),
                "stock_transfer_status_id": data.get("stock_transfer_status_id"),
            }
            update_data = {key: value for key, value in update_data.items() if value is not None}

            if update_data:
                response = supabase.table("Stock_Transfer").update(update_data) \
                    .eq("stock_transfer_id", stock_transfer_id).execute()
                if not response.data:
                    return Response({"error": "Stock transfer not found or not updated"}, status=404)

            return Response({"message": "Stock transfer updated successfully"}, status=200)

        except Exception as e:
            print(f"❌ Exception: {str(e)}")  # Debugging
            return Response({"error": str(e)}, status=500)

   
    def delete(self, request, stock_transfer_id):
        try:
            response = supabase.table("Stock_Transfer").delete().eq('stock_transfer_id', stock_transfer_id).execute()

            if response.data:
                return Response({"message": "Stock Transfer deleted successfully"}, status=204)
            else:
                return Response({"error": "Stock Transfer not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
