from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Customer


class Customers(APIView):
    def get(self, request, customer_id=None):
        try:
            if customer_id is not None:
                try:
                    obj = Customer.objects.get(customer_id=customer_id)
                except Customer.DoesNotExist:
                    return Response({"error": "No Customers found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = Customer.objects.all()
            if not qs.exists():
                return Response({"error": "No Customers found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = Customer.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, customer_id):
        data = request.data
        try:
            updated = Customer.objects.filter(customer_id=customer_id).update(**data)
            if updated:
                obj = Customer.objects.get(customer_id=customer_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Customer not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, customer_id):
        try:
            deleted, _ = Customer.objects.filter(customer_id=customer_id).delete()
            if deleted:
                return Response({"message": "Customer deleted successfully"}, status=204)
            return Response({"error": "Customer not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
