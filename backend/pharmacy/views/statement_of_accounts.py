import traceback

from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Customer, DswdOrder, POS, POSItem, Person


class StatementOfAccounts(APIView):
    def get(self, request):
        try:
            # Get ALL DSWD orders
            dswd_orders = DswdOrder.objects.all()
            results = []

            for order in dswd_orders:
                customer_id = order.customer_id

                # Get customer
                customer = None
                person = None
                if customer_id:
                    try:
                        customer = Customer.objects.select_related('person').get(customer_id=customer_id)
                        person = customer.person
                    except Customer.DoesNotExist:
                        pass

                # Get invoice from POS
                pos_id = order.pos_id
                invoice = "Unknown"
                amount = 0

                if pos_id:
                    try:
                        pos = POS.objects.get(pos_id=pos_id)
                        invoice = pos.invoice or "Unknown"
                    except POS.DoesNotExist:
                        pass

                    # Calculate amount from POS items
                    pos_items = POSItem.objects.filter(pos_id=pos_id)
                    for pos_item in pos_items:
                        if pos_item.price and pos_item.quantity_sold:
                            amount += float(pos_item.price) * pos_item.quantity_sold

                # Construct entry
                entry = {
                    "gl_date": str(order.gl_date) if order.gl_date else None,
                    "gl_no": order.gl_num,
                    "patient_name": f"{person.first_name} {person.last_name}" if person else "Unknown",
                    "client_name": order.client_name,
                    "date_received": str(order.claim_date) if order.claim_date else None,
                    "invoice": invoice,
                    "amount": f"{amount:,.2f}",
                }

                results.append(entry)

            return Response(results, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
