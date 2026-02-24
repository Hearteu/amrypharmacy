from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import CustomerType as CustomerTypeModel


class CustomerType(APIView):
    def get(self, request, customerType_id=None):
        try:
            if customerType_id is not None:
                try:
                    obj = CustomerTypeModel.objects.get(customer_type_id=customerType_id)
                except CustomerTypeModel.DoesNotExist:
                    return Response({"error": "No Customer Type found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = CustomerTypeModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Customer Type found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = CustomerTypeModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, customerType_id):
        data = request.data
        try:
            updated = CustomerTypeModel.objects.filter(customer_type_id=customerType_id).update(**data)
            if updated:
                obj = CustomerTypeModel.objects.get(customer_type_id=customerType_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Customer Type not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, customerType_id):
        try:
            deleted, _ = CustomerTypeModel.objects.filter(customer_type_id=customerType_id).delete()
            if deleted:
                return Response({"message": "Customer Type deleted successfully"}, status=204)
            return Response({"error": "Customer Type not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
