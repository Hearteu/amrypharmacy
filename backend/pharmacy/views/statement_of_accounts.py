# pharmacy/views/statement_of_accounts.py

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

class StatementOfAccounts(APIView):
    def get(self, request):
        try:
            # 🔄 Get ALL DSWD orders
            dswd_orders = supabase.table("Dswd_Order").select("*").execute().data
            results = []

            for order in dswd_orders:
                customer_id = order.get("customer_id")
                dswd_order_id = order.get("dswd_order_id")

                # 🔍 Get customer
                customer_data = supabase.table("Customers").select("*").eq("customer_id", customer_id).execute().data
                customer = customer_data[0] if customer_data else None

                # 🔍 Get person
                person = None
                if customer:
                    person_id = customer.get("person_id")
                    person_data = supabase.table("Person").select("*").eq("person_id", person_id).execute().data
                    person = person_data[0] if person_data else None

                # 🔢 Get invoice from DSWD order
                pos_id = order.get("pos_id")
                amount = 0

                pos_data = supabase.table("POS").select("invoice").eq("pos_id", pos_id).execute().data

                pos_item_data = supabase.table("POS_Item").select("price", "quantity_sold").eq("pos_id", pos_id).execute().data

                for pos_item in pos_item_data:
                    price = pos_item.get("price")
                    quantity_sold = pos_item.get("quantity_sold")
                    if price and quantity_sold:
                        amount += price * quantity_sold

                # 📦 Construct entry
                entry = {
                    "gl_date": order["gl_date"],
                    "gl_no": order["gl_num"],
                    "patient_name": f"{person['first_name']} {person['last_name']}" if person else "Unknown",
                    "client_name": order["client_name"],
                    "date_received": order["claim_date"],
                    "invoice": pos_data[0]["invoice"] if pos_data else "Unknown",
                    "amount": f"{amount:,.2f}"
                }

                results.append(entry)

            print(f"\n✅ Total entries returned: {len(results)}")
            return Response(results, status=200)

        except Exception as e:
            print(f"❌ Error in StatementOfAccounts view: {e}")
            return Response({"error": str(e)}, status=500)
