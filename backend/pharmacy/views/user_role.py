from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import UserRole as UserRoleModel


class UserRole(APIView):
    def get(self, request, role_id=None):
        try:
            if role_id is not None:
                try:
                    obj = UserRoleModel.objects.get(role_id=role_id)
                except UserRoleModel.DoesNotExist:
                    return Response({"error": "No User Roles found"}, status=404)
                return Response(model_to_dict(obj), status=200)

            qs = UserRoleModel.objects.all()
            if not qs.exists():
                return Response({"error": "No User Roles found"}, status=404)
            return Response(list(qs.values()), status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        data = request.data
        try:
            obj = UserRoleModel.objects.create(**data)
            return Response(model_to_dict(obj), status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, role_id):
        data = request.data
        try:
            updated = UserRoleModel.objects.filter(role_id=role_id).update(**data)
            if updated:
                obj = UserRoleModel.objects.get(role_id=role_id)
                return Response(model_to_dict(obj), status=200)
            return Response({"error": "User_Role not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, role_id):
        try:
            deleted, _ = UserRoleModel.objects.filter(role_id=role_id).delete()
            if deleted:
                return Response({"message": "User_Role deleted successfully"}, status=204)
            return Response({"error": "User_Role not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
