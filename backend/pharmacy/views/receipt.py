# views.py

from calendar import month_name
from collections import defaultdict
from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class Receipt(APIView):
    def get(self, request):
        try:
            # Optional month filtering
            month_param = request.query_params.get('month', '').strip().lower()
            month_lookup = {name.lower(): i for i, name in enumerate(month_name) if name}
            month_number = month_lookup.get(month_param) if month_param else None

            # Load Stock_Transaction data
            stock_transactions = supabase.table('Stock_Transaction').select('*').ilike('transaction_type', 'pos').execute()
            transactions = stock_transactions.data or []

            if not transactions:
                return Response({"error": "No POS transactions found"}, status=404)

            # POS and related data
            pos_ids = list({txn['reference_id'] for txn in transactions if txn.get('reference_id')})
            pos_list = supabase.table('POS').select('*').in_('pos_id', pos_ids).execute().data
            pos_map = {pos['pos_id']: pos for pos in pos_list}

            pos_items = supabase.table('POS_Item').select('*').in_('pos_id', pos_ids).execute().data
            pos_items_by_pos = defaultdict(list)
            for item in pos_items:
                total_price = item["quantity_sold"] * item["price"]
                item["total_price"] = total_price
                pos_items_by_pos[item['pos_id']].append(item)

            prescription_ids = [pos['prescription_id'] for pos in pos_list if pos.get('prescription_id')]
            prescriptions = supabase.table('Prescription').select('*').in_('prescription_id', prescription_ids).execute().data
            prescription_map = {p['prescription_id']: p for p in prescriptions}

            customer_ids = [p['customer_id'] for p in prescriptions if p.get('customer_id')]
            customers = supabase.table('Customers').select('*').in_('customer_id', customer_ids).execute().data
            customer_map = {c['customer_id']: c for c in customers}

            customer_type_ids = [c['customer_type_id'] for c in customers if c.get('customer_type_id')]
            customer_types = supabase.table('Customer_Type').select('*').in_('customer_type_id', customer_type_ids).execute().data
            customer_type_map = {ct['customer_type_id']: ct for ct in customer_types}

            # Organize monthly -> daily sales
            monthly_sales = defaultdict(lambda: defaultdict(lambda: {
                "Asuncion": 0.0,
                "Talaingod": 0.0,
                "regular_sales": 0.0,
                "total_dswd": 0.0
            }))

            for txn in transactions:
                pos = pos_map.get(txn['reference_id'])
                if not pos:
                    continue

                txn_date_str = txn.get('transaction_date')
                if not txn_date_str:
                    continue

                txn_date = datetime.fromisoformat(txn_date_str.replace('Z', '+00:00'))
                if month_number and txn_date.month != month_number:
                    continue

                date_key = txn_date.strftime('%m/%d/%Y')
                month_key = txn_date.strftime('%B')  # e.g., "May"
                month_index = txn_date.month

                branch = str(txn.get('src_location'))
                items = pos_items_by_pos.get(pos['pos_id'], [])
                total_amount = sum(item['total_price'] for item in items)

                is_dswd = False
                presc = prescription_map.get(pos.get('prescription_id'))
                if presc:
                    cust = customer_map.get(presc.get('customer_id'))
                    cust_type = customer_type_map.get(cust.get('customer_type_id')) if cust else None
                    if cust_type and cust_type.get("discount", 0) >= 100:
                        is_dswd = True

                sales = monthly_sales[(month_index, month_key)][date_key]
                if is_dswd:
                    sales['total_dswd'] += total_amount
                else:
                    if branch == '1':
                        sales['Asuncion'] += total_amount
                    elif branch == '2':
                        sales['Talaingod'] += total_amount
                    sales['regular_sales'] += total_amount

            # Build response
            all_months_response = []
            for (month_index, month_name_str) in sorted(monthly_sales.keys()):
                daily_sales = []
                monthly_regular = 0.0
                monthly_dswd = 0.0

                for date, values in sorted(monthly_sales[(month_index, month_name_str)].items()):
                    rounded_values = {
                        "Asuncion": "{:.2f}".format(values['Asuncion']),
                        "Talaingod": "{:.2f}".format(values['Talaingod']),
                        "regular_sales": "{:.2f}".format(values['regular_sales']),
                        "total_dswd": "{:.2f}".format(values['total_dswd'])
                    }
                    daily_sales.append({
                        "date": date,
                        **rounded_values
                    })
                    monthly_regular += values['regular_sales']
                    monthly_dswd += values['total_dswd']

                all_months_response.append({
                    "month": month_name_str,
                    "daily_sales_summary": daily_sales,
                    "monthly_summary": {
                        "monthly_regular_sales": "{:.2f}".format(monthly_regular),
                        "monthly_total_dswd": "{:.2f}".format(monthly_dswd)
                    }
                })

            return Response(all_months_response, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    def post(self, request):
        data = request.data 
        try:
           
            response = supabase.table("Receipt").insert(data).execute()
            return Response(response.data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
 
    def put(self, request, receipt_id):
        data = request.data 
        try:
            response = supabase.table("Receipt").update(data).eq('receipt_id', receipt_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Receipt not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
   
    def delete(self, request, receipt_id):
        try:
            response = supabase.table("Receipt").delete().eq('receipt_id', receipt_id).execute()

            if response.data:
                return Response({"message": "Receipt deleted successfully"}, status=204)
            else:
                return Response({"error": "Receipt not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
