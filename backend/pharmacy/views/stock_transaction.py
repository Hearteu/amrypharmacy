import traceback
from collections import defaultdict
from datetime import datetime

from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (Customer, CustomerType, DswdOrder, Location, POS,
                       POSItem, Person, Prescription, StockTransaction)


class StockTransactionView(APIView):
    def get(self, request):
        try:
            transaction_type = request.GET.get('transaction_type')
            branch = request.GET.get('branch')

            qs = StockTransaction.objects.all().order_by('-transaction_date')

            if transaction_type:
                qs = qs.filter(transaction_type__iexact=transaction_type)
            if branch:
                qs = qs.filter(src_location=int(branch))

            if not qs.exists():
                return Response({"error": "No transactions found"}, status=404)

            transactions = list(qs.values())

            # For POS transactions: only include first occurrence per reference_id
            processed_pos_ids = set()
            pos_ids = set()
            filtered = []

            for txn in transactions:
                if txn.get('transaction_type', '').lower() == 'pos':
                    ref_id = txn['reference_id']
                    if ref_id in processed_pos_ids:
                        continue
                    processed_pos_ids.add(ref_id)
                    pos_ids.add(ref_id)
                filtered.append(txn)

            # Enrich POS transactions with related data
            if pos_ids:
                pos_map = {}
                for pos in POS.objects.filter(pos_id__in=pos_ids):
                    pos_map[pos.pos_id] = {
                        "pos_id": pos.pos_id,
                        "invoice": pos.invoice,
                        "order_type": pos.order_type,
                        "sale_date": str(pos.sale_date) if pos.sale_date else None,
                        "prescription_id": pos.prescription_id,
                    }

                # Get prescriptions, customers, customer types
                prescription_ids = [p["prescription_id"] for p in pos_map.values() if p.get("prescription_id")]
                prescription_map = {}
                customer_map = {}
                customer_type_map = {}

                if prescription_ids:
                    for presc in Prescription.objects.filter(prescription_id__in=prescription_ids).select_related('customer'):
                        prescription_map[presc.prescription_id] = {
                            "prescription_id": presc.prescription_id,
                            "customer_id": presc.customer_id,
                        }

                    customer_ids = [p["customer_id"] for p in prescription_map.values() if p.get("customer_id")]
                    if customer_ids:
                        for cust in Customer.objects.filter(customer_id__in=customer_ids).select_related('person', 'customer_type'):
                            customer_map[cust.customer_id] = {
                                "customer_id": cust.customer_id,
                                "customer_type_id": cust.customer_type_id,
                                "person_name": str(cust.person) if cust.person else None,
                            }
                            if cust.customer_type:
                                customer_type_map[cust.customer_type_id] = {
                                    "customer_type_id": cust.customer_type.customer_type_id,
                                    "description": cust.customer_type.description,
                                    "discount": float(cust.customer_type.discount),
                                }

                # Get locations
                location_ids = set()
                for txn in filtered:
                    if txn.get('src_location'):
                        location_ids.add(txn['src_location'])
                    if txn.get('des_location'):
                        location_ids.add(txn['des_location'])

                loc_map = {}
                if location_ids:
                    for loc in Location.objects.filter(location_id__in=location_ids):
                        loc_map[loc.location_id] = loc.location

                # Enrich filtered transactions
                for txn in filtered:
                    txn['src_location_name'] = loc_map.get(txn.get('src_location'))
                    txn['des_location_name'] = loc_map.get(txn.get('des_location'))

                    if txn.get('transaction_type', '').lower() == 'pos' and txn.get('reference_id') in pos_map:
                        pos_data = pos_map[txn['reference_id']]
                        txn['POS'] = pos_data

                        presc = prescription_map.get(pos_data.get('prescription_id'))
                        if presc:
                            txn['Prescription'] = presc
                            cust = customer_map.get(presc.get('customer_id'))
                            if cust:
                                txn['Customer'] = cust
                                ct = customer_type_map.get(cust.get('customer_type_id'))
                                if ct:
                                    txn['Customer_Type'] = ct

            return Response(filtered, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            stock_item_id = data.get("stock_item_id")
            transaction_type = data.get("transaction_type")
            reference_id = data.get("reference_id")
            src_location = data.get("src_location")
            des_location = data.get("des_location")
            quantity_change = int(data.get("quantity_change", 0))
            transaction_date = data.get("transaction_date")

            from ..models import StockItem
            # Validate stock item
            try:
                stock_item = StockItem.objects.get(stock_item_id=stock_item_id)
            except StockItem.DoesNotExist:
                return Response({"error": "Stock item not found"}, status=404)

            current_quantity = stock_item.quantity

            # Check stock doesn't go negative for outbound
            if quantity_change < 0 and (current_quantity + quantity_change) < 0:
                return Response({"error": "Insufficient stock"}, status=400)

            # Insert transaction
            txn = StockTransaction.objects.create(
                stock_item_id=stock_item_id,
                transaction_type=transaction_type,
                reference_id=reference_id,
                src_location=src_location,
                des_location=des_location,
                quantity_change=quantity_change,
                transaction_date=transaction_date,
            )

            # Update stock item quantity
            stock_item.quantity = current_quantity + quantity_change
            stock_item.save()

            return Response({
                "stock_transaction_id": txn.stock_transaction_id,
                "message": "Stock transaction created successfully",
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    def put(self, request, stock_transaction_id):
        data = request.data
        try:
            updated = StockTransaction.objects.filter(stock_transaction_id=stock_transaction_id).update(**data)
            if updated:
                return Response({"message": "Stock transaction updated successfully"}, status=200)
            return Response({"error": "Stock transaction not found"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, stock_transaction_id):
        try:
            deleted, _ = StockTransaction.objects.filter(stock_transaction_id=stock_transaction_id).delete()
            if deleted:
                return Response({"message": "Stock transaction deleted successfully"}, status=204)
            return Response({"error": "Stock transaction not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
