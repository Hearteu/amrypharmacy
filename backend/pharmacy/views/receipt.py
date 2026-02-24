import traceback
from calendar import month_name
from collections import defaultdict
from datetime import datetime

from django.db.models import Sum
from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Customer, CustomerType, POS, POSItem, Person,
                       Prescription, Receipt as ReceiptModel,
                       StockTransaction)


class Receipt(APIView):
    def get(self, request):
        try:
            # Optional month filtering
            month_param = request.query_params.get('month', '').strip().lower()
            month_lookup = {name.lower(): i for i, name in enumerate(month_name) if name}
            month_number = month_lookup.get(month_param) if month_param else None

            # Load POS-type Stock Transactions
            transactions = StockTransaction.objects.filter(
                transaction_type__iexact='pos'
            ).values()

            transactions = list(transactions)

            if not transactions:
                return Response({"error": "No POS transactions found"}, status=404)

            # POS and related data
            pos_ids = list({txn['reference_id'] for txn in transactions if txn.get('reference_id')})
            pos_map = {pos.pos_id: pos for pos in POS.objects.filter(pos_id__in=pos_ids)}

            # POS Items
            pos_items = POSItem.objects.filter(pos_id__in=pos_ids).values(
                'pos_id', 'price', 'quantity_sold'
            )
            pos_items_by_pos = defaultdict(list)
            for item in pos_items:
                total_price = float(item["quantity_sold"]) * float(item["price"])
                item["total_price"] = total_price
                pos_items_by_pos[item['pos_id']].append(item)

            # Prescriptions, Customers, Customer Types
            prescription_ids = [pos.prescription_id for pos in pos_map.values() if pos.prescription_id]
            prescription_map = {}
            customer_map = {}
            customer_type_map = {}

            if prescription_ids:
                prescriptions = Prescription.objects.filter(prescription_id__in=prescription_ids)
                prescription_map = {p.prescription_id: p for p in prescriptions}

                customer_ids = [p.customer_id for p in prescriptions if p.customer_id]
                if customer_ids:
                    customers = Customer.objects.filter(customer_id__in=customer_ids).select_related('customer_type')
                    customer_map = {c.customer_id: c for c in customers}
                    for c in customers:
                        if c.customer_type:
                            customer_type_map[c.customer_type_id] = c.customer_type

            # Organize monthly -> daily sales
            monthly_sales = defaultdict(lambda: defaultdict(lambda: {
                "Asuncion": 0.0,
                "Talaingod": 0.0,
                "regular_sales": 0.0,
                "total_dswd": 0.0,
            }))

            for txn in transactions:
                pos = pos_map.get(txn['reference_id'])
                if not pos:
                    continue

                txn_date_str = txn.get('transaction_date')
                if not txn_date_str:
                    continue

                if isinstance(txn_date_str, str):
                    txn_date = datetime.fromisoformat(txn_date_str.replace('Z', '+00:00'))
                else:
                    txn_date = txn_date_str

                if month_number and txn_date.month != month_number:
                    continue

                date_key = txn_date.strftime('%m/%d/%Y')
                month_key = txn_date.strftime('%B')
                month_index = txn_date.month

                branch = str(txn.get('src_location'))
                items = pos_items_by_pos.get(pos.pos_id, [])
                total_amount = sum(item['total_price'] for item in items)

                is_dswd = False
                presc = prescription_map.get(pos.prescription_id)
                if presc:
                    cust = customer_map.get(presc.customer_id)
                    if cust and cust.customer_type:
                        if cust.customer_type.discount >= 100:
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
                        "total_dswd": "{:.2f}".format(values['total_dswd']),
                    }
                    daily_sales.append({"date": date, **rounded_values})
                    monthly_regular += values['regular_sales']
                    monthly_dswd += values['total_dswd']

                all_months_response.append({
                    "month": month_name_str,
                    "daily_sales_summary": daily_sales,
                    "monthly_summary": {
                        "monthly_regular_sales": "{:.2f}".format(monthly_regular),
                        "monthly_total_dswd": "{:.2f}".format(monthly_dswd),
                    },
                })

            return Response(all_months_response, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = ReceiptModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, receipt_id):
        data = request.data
        try:
            updated = ReceiptModel.objects.filter(receipt_id=receipt_id).update(**data)
            if updated:
                obj = ReceiptModel.objects.get(receipt_id=receipt_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Receipt not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, receipt_id):
        try:
            deleted, _ = ReceiptModel.objects.filter(receipt_id=receipt_id).delete()
            if deleted:
                return Response({"message": "Receipt deleted successfully"}, status=204)
            return Response({"error": "Receipt not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
