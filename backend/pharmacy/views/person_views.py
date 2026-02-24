from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Person


class PersonList(APIView):
    def get(self, request, person_id=None):
        try:
            if person_id is not None:
                try:
                    obj = Person.objects.get(person_id=person_id)
                except Person.DoesNotExist:
                    return Response({"error": "No Person found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = Person.objects.all()
            if not qs.exists():
                return Response({"error": "No Person found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = Person.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, person_id):
        data = request.data
        try:
            updated = Person.objects.filter(person_id=person_id).update(**data)
            if updated:
                obj = Person.objects.get(person_id=person_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Person not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, person_id):
        try:
            deleted, _ = Person.objects.filter(person_id=person_id).delete()
            if deleted:
                return Response({"message": "Person deleted successfully"}, status=204)
            return Response({"error": "Person not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
