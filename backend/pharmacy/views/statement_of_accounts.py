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
                invoice = order.get("invoice")
                amount = 0

                # ✅ Get total_amount directly from POS using invoice
                if invoice:
                    pos_data = supabase.table("POS").select("total_amount").eq("invoice", invoice).execute().data
                    if pos_data:
                        amount = pos_data[0].get("total_amount", 0)

                # 📦 Construct entry
                entry = {
                    "gl_date": order["gl_date"],
                    "gl_no": order["gl_num"],
                    "client_name": f"{person['first_name']} {person['last_name']}" if person else "Unknown",
                    "date_received": order["claim_date"],
                    "invoice": invoice,
                    "amount": amount
                }

                results.append(entry)

            print(f"\n✅ Total entries returned: {len(results)}")
            return Response(results, status=200)

        except Exception as e:
            print(f"❌ Error in StatementOfAccounts view: {e}")
            return Response({"error": str(e)}, status=500)
