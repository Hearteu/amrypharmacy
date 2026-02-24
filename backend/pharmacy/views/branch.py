from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Branch as BranchModel


class Branch(APIView):
    def get(self, request, branch_id=None):
        try:
            if branch_id is not None:
                try:
                    obj = BranchModel.objects.get(branch_id=branch_id)
                except BranchModel.DoesNotExist:
                    return Response({"error": "No Branch found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = BranchModel.objects.all()
            if not qs.exists():
                return Response({"error": "No Branch found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = BranchModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, branch_id):
        data = request.data
        try:
            updated = BranchModel.objects.filter(branch_id=branch_id).update(**data)
            if updated:
                obj = BranchModel.objects.get(branch_id=branch_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "Branch not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, branch_id):
        try:
            deleted, _ = BranchModel.objects.filter(branch_id=branch_id).delete()
            if deleted:
                return Response({"message": "Branch deleted successfully"}, status=204)
            return Response({"error": "Branch not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
