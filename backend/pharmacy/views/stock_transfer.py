# views.py

from datetime import datetime, timedelta, timezone

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class StockTransfer(APIView):
    # def get(self, request, direction=None, location_id=None, stock_transfer_id=None):
    #     """
    #     Get stock transfers with optional filters:
    #     - If direction and location_id are provided: filter by src/des location.
    #     - If stock_transfer_id is provided: filter by reference ID.
    #     - If no direction/location: return all 'Transfer' type stock transactions.
    #     - Query params: ?start_date=2024-04-01&end_date=2024-04-03
    #     """
    #     try:
    #         query = supabase.table("Stock_Transaction").select("*")

    #         # Always filter for Transfer type
    #         query = query.eq("transaction_type", "Transfer")

    #         if direction and direction in ["src", "des"]:
    #             column = "src_location" if direction == "src" else "des_location"
    #             query = query.eq(column, location_id)
    #         elif direction:
    #             return Response({"error": "Invalid direction. Use 'src' or 'des'."}, status=400)

    #         if stock_transfer_id:
    #             query = query.eq("reference_id", stock_transfer_id)

    #         # Optional date filters
    #         start_date = request.query_params.get("start_date")
    #         end_date = request.query_params.get("end_date")

    #         if start_date:
    #             query = query.gte("transaction_date", start_date)
    #         if end_date:
    #             query = query.lte("transaction_date", end_date)

    #         transactions = query.order("transaction_date", desc=True).execute()

    #         return Response(transactions.data, status=200)

    #     except Exception as e:
    #         print(f"❌ Error fetching stock transfers: {str(e)}")
    #         return Response({"error": str(e)}, status=500)
    def get(self, request, direction=None, location_id=None, stock_transfer_id=None):
        """Retrieve all stock transfers or a single stock transfer by ID with transferItems.
        If direction and location_id are provided, filters by src or des location.
        """
        try:
            query = supabase.table("Stock_Transfer").select(
                "stock_transfer_id, transfer_id, transfer_date, stock_transfer_status_id, "
                "Stock_Transfer_Status!inner(stock_transfer_status), "
                "src_location, src_location_data:Location!src_location(location), "
                "des_location, des_location_data:Location!des_location(location), "
                "Stock_Transfer_Item (stock_transfer_item_id, sti_id, ordered_quantity, stock_transfer_item_status_id, "
                "unit_id, transferred_qty, product_id, Unit (unit), "
                "Products (product_name, Drugs (dosage_strength, dosage_form)))"
            )

            if stock_transfer_id:
                query = query.eq("stock_transfer_id", stock_transfer_id).single()
            elif direction in ["src", "des"] and location_id:
                location_column = "src_location" if direction == "src" else "des_location"
                query = query.eq(location_column, location_id)

            response = query.execute()

            if not response.data:
                return Response({"error": "No stock transfers found"}, status=404)

            stock_transfers = [response.data] if isinstance(response.data, dict) else response.data
            formatted_transfers = []

            # Collect product_ids from Stock_Transfer_Item
            product_ids = {
                item["product_id"]
                for transfer in stock_transfers
                for item in (transfer.get("Stock_Transfer_Item") or [])
                if item.get("product_id") is not None
            }

            # Fetch stock quantities based on Expiration table
            stock_response = supabase.table("Expiration").select(
                "stock_item_id, quantity"
            ).in_("stock_item_id", list(product_ids)).filter(
                "expiry_date", "gte", (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")
            ).execute()

            # Manually sum quantities per stock_item_id
            stock_items = {}
            for item in (stock_response.data or []):
                stock_id = item["stock_item_id"]
                quantity = item.get("quantity", 0)
                stock_items[stock_id] = stock_items.get(stock_id, 0) + quantity


            for transfer in stock_transfers:
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

                for item in transfer.get("Stock_Transfer_Item") or []:
                    product_id = item.get("product_id")
                    stock_quantity = stock_items.get(product_id, 0) if product_id is not None else 0
                    product = item.get("Products") or {}
                    product_name = product.get("product_name", "Unknown")
                    drug = product.get("Drugs") or {}

                    if drug:
                        product_name += f" {drug.get('dosage_form', '')} {drug.get('dosage_strength', '')}".strip()

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
                        "current_stock_quantity": stock_quantity
                    })

                formatted_transfers.append(formatted_transfer)

            return Response(formatted_transfers if stock_transfer_id is None else formatted_transfers[0], status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

            
    # def get(self, request, stock_transfer_id=None):
    #     """Retrieve all stock transfers or a single stock transfer by ID with transferItems"""
    #     try:
    #         query = supabase.table("Stock_Transfer").select(
    #             "stock_transfer_id, transfer_id, transfer_date, stock_transfer_status_id, "
    #             "Stock_Transfer_Status!inner(stock_transfer_status), "
    #             "src_location, src_location_data:Location!src_location(location), "  # Source Location
    #             "des_location, des_location_data:Location!des_location(location), "  # Destination Location
    #             "Stock_Transfer_Item (stock_transfer_item_id, sti_id, ordered_quantity, stock_transfer_item_status_id, "
    #             "unit_id, transferred_qty, product_id, Unit (unit), "
    #             "Products (product_name, Drugs (dosage_strength, dosage_form)))"
    #         )

    #         if stock_transfer_id is not None:
    #             query = query.eq("stock_transfer_id", stock_transfer_id).single()

    #         response = query.execute()

    #         if not response.data:
    #             return Response({"error": "No stock transfers found"}, status=404)

    #         stock_transfers = [response.data] if isinstance(response.data, dict) else response.data
    #         formatted_transfers = []

    #         # Collect product_ids to fetch stock quantities, ensuring no None values
    #         product_ids = {
    #             item["product_id"]
    #             for transfer in stock_transfers
    #             for item in (transfer.get("Stock_Transfer_Item") or [])
    #             if item.get("product_id") is not None
    #         }

    #         if product_ids:
    #             # Fetch stock quantities based on Expiration table
    #             stock_response = supabase.table("Expiration").select(
    #                 "stock_item_id, SUM(quantity) as total_quantity"
    #             ).in_("stock_item_id", list(product_ids)).filter(
    #                 "expiry_date", "gte", (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")
    #             ).group("stock_item_id").execute()

    #             stock_items = {item["stock_item_id"]: item["total_quantity"] for item in stock_response.data} if stock_response.data else {}

    #         for transfer in stock_transfers:
    #             stock_transfer_items = transfer.get("Stock_Transfer_Item") or []

    #             formatted_transfer = {
    #                 "stock_transfer_id": transfer["stock_transfer_id"],
    #                 "transfer_id": transfer["transfer_id"],
    #                 "transfer_date": transfer["transfer_date"],
    #                 "status_id": transfer["stock_transfer_status_id"],
    #                 "status": (transfer.get("Stock_Transfer_Status") or {}).get("stock_transfer_status", "Unknown"),
    #                 "src_location_id": transfer.get("src_location"),
    #                 "src_location_name": (transfer.get("src_location_data") or {}).get("location", "Unknown"),
    #                 "des_location_id": transfer.get("des_location"),
    #                 "des_location_name": (transfer.get("des_location_data") or {}).get("location", "Unknown"),
    #                 "transferItems": [],
    #             }

    #             for item in stock_transfer_items:
    #                 product_id = item.get("product_id")
    #                 stock_quantity = stock_items.get(product_id, 0) if product_id is not None else 0
    #                 product = item.get("Products") or {}
    #                 product_name = product.get("product_name", "Unknown")
    #                 drug = product.get("Drugs") or {}

    #                 if drug:
    #                     product_name += f" {drug.get('dosage_form', '')} {drug.get('dosage_strength', '')}".strip()

    #                 formatted_transfer["transferItems"].append({
    #                     "stock_transfer_item_id": item["stock_transfer_item_id"],
    #                     "sti_id": item.get("sti_id", ""),
    #                     "product_id": product_id if product_id is not None else 0,
    #                     "product_name": product_name,
    #                     "ordered_quantity": item["ordered_quantity"],
    #                     "transferred_qty": item.get("transferred_qty", 0),
    #                     "stock_transfer_item_status_id": item.get("stock_transfer_item_status_id", "Unknown"),
    #                     "unit_id": item.get("unit_id", "N/A"),
    #                     "unit": (item.get("Unit") or {}).get("unit", "N/A"),
    #                     "current_stock_quantity": stock_quantity
    #                 })

    #             formatted_transfers.append(formatted_transfer)

    #         return Response(formatted_transfers if stock_transfer_id is None else formatted_transfers[0], status=200)

    #     except Exception as e:
    #         return Response({"error": str(e)}, status=500)


    def post(self, request):
        """Create a new stock transfer with items"""
        try:
            data = request.data
            print(f"🟢 Submitted Data: {data}")  # Debugging input

            src_location = int(data.get("src_location_id"))  # ✅ Correct key
            des_location = int(data.get("des_location_id"))  # ✅ Correct key
            transfer_date = data.get("transfer_date")
            items = data.get("transferItems", [])  # ✅ Correct key

            # ✅ Generate transfer_id (ST-YYYY-XXX)
            year = datetime.now().year
            last_transfer = (
                supabase.table("Stock_Transfer")
                .select("transfer_id")
                .order("transfer_id", desc=True)
                .limit(1)
                .execute()
            )

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
                "des_location": des_location,
            }
            response = supabase.table("Stock_Transfer").insert(stock_transfer).execute()

            if not response.data:
                return Response({"error": "Failed to create stock transfer"}, status=400)

            stock_transfer_id = response.data[0]["stock_transfer_id"]

            # ✅ Insert items into Stock_Transfer_Item
            stock_transfer_items = []
            for idx, item in enumerate(items, start=1):
                stock_transfer_item = {
                    "stock_transfer_id": stock_transfer_id,
                    "sti_id": f"STI-{transfer_id.split('-')[-1]}-{str(idx).zfill(2)}",  # ✅ Keeping custom sti_id
                    "product_id": item["product_id"],
                    "ordered_quantity": item["ordered_quantity"],  # ✅ Correct key
                    "stock_transfer_item_status_id": 1,
                    "unit_id": item.get("unit_id"),
                }
                stock_transfer_items.append(stock_transfer_item)

            if stock_transfer_items:
                supabase.table("Stock_Transfer_Item").insert(stock_transfer_items).execute()

            return Response(
                {"message": "Stock transfer created successfully", "transfer_id": transfer_id},
                status=201,
            )

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
                update_response = (
                    supabase.table("Stock_Transfer")
                    .update({"stock_transfer_status_id": data["stock_transfer_status_id"]})
                    .eq("stock_transfer_id", stock_transfer_id)
                    .execute()
                )

                if not update_response.data:
                    return Response(
                        {"error": "Stock transfer not found or not updated"}, status=404
                    )

                print(f"✅ Updated Stock Transfer Status: {update_response}")

                # ✅ If status is "Completed", update all stock transfer items and handle stock movement
                if data["stock_transfer_status_id"] == 4:
                    # Update all stock transfer items to completed
                    supabase.table("Stock_Transfer_Item").update(
                        {"stock_transfer_item_status_id": 4}
                    ).eq("stock_transfer_id", stock_transfer_id).execute()

                    # Fetch stock transfer details
                    transfer_query = (
                        supabase.table("Stock_Transfer")
                        .select("src_location, des_location")
                        .eq("stock_transfer_id", stock_transfer_id)
                        .single()
                        .execute()
                    )
                    transfer_data = transfer_query.data

                    if not transfer_data:
                        return Response(
                            {"error": "Stock transfer locations not found"}, status=404
                        )

                    src_location = transfer_data["src_location"]
                    des_location = transfer_data["des_location"]

                    # Fetch stock transfer items
                    items_query = (
                        supabase.table("Stock_Transfer_Item")
                        .select("product_id, ordered_quantity, stock_transfer_item_id")
                        .eq("stock_transfer_id", stock_transfer_id)
                        .execute()
                    )
                    items = items_query.data or []

                    for item in items:
                        product_id = item["product_id"]
                        qty = item["ordered_quantity"]
                        stock_transfer_item_id = item["stock_transfer_item_id"]

                        # ✅ Fetch current stock from source location
                        src_stock_query = (
                            supabase.table("Stock_Item")
                            .select("quantity")
                            .eq("product_id", product_id)
                            .eq("location_id", src_location)
                            .single()
                            .execute()
                        )
                        src_stock_data = src_stock_query.data
                        print(f"🔍 Source Stock Data: {src_stock_data}")

                        if src_stock_data:
                            new_src_quantity = max(0, src_stock_data["quantity"] - qty)
                            print(f"🔍 New Source Quantity: {new_src_quantity}")
                            supabase.table("Stock_Item").update(
                                {"quantity": new_src_quantity}
                            ).eq("product_id", product_id).eq("location_id", src_location).execute()

                        # ✅ Fetch current stock from destination location
                        des_stock_query = (
                            supabase.table("Stock_Item")
                            .select("quantity")
                            .eq("product_id", product_id)
                            .eq("location_id", des_location)
                            .single()
                            .execute()
                        )
                        des_stock_data = des_stock_query.data
                        print(f"🔍 Destination Stock Data: {des_stock_data}")

                        new_des_quantity = des_stock_data["quantity"] + qty
                        print(f"🔍 New Destination Quantity: {new_des_quantity}")
                        stock_item_res = supabase.table("Stock_Item").update({"quantity": new_des_quantity}).eq("product_id", product_id).eq("location_id", des_location).execute()

                        # Insert into Stock_Transaction
                        supabase.table("Stock_Transaction").insert(
                            {
                                "quantity_change": qty,
                                "transaction_type": "Transfer",
                                "src_location": src_location,
                                "des_location": des_location,
                                "transaction_date": datetime.now(timezone.utc).isoformat(),
                                "stock_item_id": stock_item_res.data[0]["stock_item_id"],
                                "reference_id": stock_transfer_item_id,
                            }
                        ).execute()

                    return Response(
                        {
                            "message": "Stock transfer and items marked as completed, stock updated."
                        },
                        status=200,
                    )

                return Response(
                    {"message": "Stock transfer status updated successfully"}, status=200
                )

            return Response({"error": "Invalid request"}, status=400)

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
