import traceback

from django.db import transaction
from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Person, Supplier as SupplierModel, Status as StatusModel


class Supplier(APIView):
    def get(self, request, supplier_id=None):
        try:
            if supplier_id is not None:
                try:
                    supplier = SupplierModel.objects.select_related('person', 'status').get(supplier_id=supplier_id)
                except SupplierModel.DoesNotExist:
                    return Response({"error": "No supplier found"}, status=404)

                data = {
                    "supplier_id": supplier.supplier_id,
                    "supplier_name": supplier.supplier_name,
                    "vat_num": supplier.vat_num,
                    "status_id": supplier.status_id,
                    "person_id": supplier.person_id,
                    "Person": {
                        "person_id": supplier.person.person_id,
                        "first_name": supplier.person.first_name,
                        "last_name": supplier.person.last_name,
                        "contact": supplier.person.contact,
                        "email": supplier.person.email,
                        "address": supplier.person.address,
                    } if supplier.person else None,
                    "Status": {
                        "status_id": supplier.status.status_id,
                        "status": supplier.status.status,
                    } if supplier.status else None,
                }
                return Response(data, status=200)

            suppliers = SupplierModel.objects.select_related('person', 'status').all()
            if not suppliers.exists():
                return Response({"error": "No supplier found"}, status=404)

            result = []
            for supplier in suppliers:
                result.append({
                    "supplier_id": supplier.supplier_id,
                    "supplier_name": supplier.supplier_name,
                    "vat_num": supplier.vat_num,
                    "status_id": supplier.status_id,
                    "person_id": supplier.person_id,
                    "Person": {
                        "person_id": supplier.person.person_id,
                        "first_name": supplier.person.first_name,
                        "last_name": supplier.person.last_name,
                        "contact": supplier.person.contact,
                        "email": supplier.person.email,
                        "address": supplier.person.address,
                    } if supplier.person else None,
                    "Status": {
                        "status_id": supplier.status.status_id,
                        "status": supplier.status.status,
                    } if supplier.status else None,
                })
            return Response(result, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @transaction.atomic
    def post(self, request):
        data = request.data
        try:
            # Create Person first
            person = Person.objects.create(
                first_name=data.get("first_name"),
                last_name=data.get("last_name"),
                contact=data.get("contact"),
                email=data.get("email"),
                address=data.get("address"),
            )

            # Create Supplier linked to Person
            supplier = SupplierModel.objects.create(
                supplier_name=data.get("supplier_name"),
                person_id=person.person_id,
                vat_num=data.get("vat_num"),
                status_id=data.get("status_id"),
            )

            return Response({
                "supplier_id": supplier.supplier_id,
                "supplier_name": supplier.supplier_name,
                "person_id": person.person_id,
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    @transaction.atomic
    def put(self, request, supplier_id):
        data = request.data
        try:
            try:
                supplier = SupplierModel.objects.get(supplier_id=supplier_id)
            except SupplierModel.DoesNotExist:
                return Response({"error": "Supplier not found"}, status=404)

            # Update Person if person-related fields are present
            person_fields = ["first_name", "last_name", "contact", "email", "address"]
            person_data = {k: v for k, v in data.items() if k in person_fields and v is not None}
            if person_data and supplier.person_id:
                Person.objects.filter(person_id=supplier.person_id).update(**person_data)

            # Update Supplier fields
            supplier_fields = ["supplier_name", "vat_num", "status_id"]
            supplier_data = {k: v for k, v in data.items() if k in supplier_fields and v is not None}
            if supplier_data:
                SupplierModel.objects.filter(supplier_id=supplier_id).update(**supplier_data)

            supplier.refresh_from_db()
            return Response(model_to_dict(supplier), status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    @transaction.atomic
    def delete(self, request, supplier_id):
        try:
            try:
                supplier = SupplierModel.objects.get(supplier_id=supplier_id)
            except SupplierModel.DoesNotExist:
                return Response({"error": "Supplier not found"}, status=404)

            person_id = supplier.person_id
            supplier.delete()

            # Also delete the associated person
            if person_id:
                Person.objects.filter(person_id=person_id).delete()

            return Response({"message": "Supplier deleted successfully"}, status=204)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)
