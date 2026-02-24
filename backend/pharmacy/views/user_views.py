import traceback
from datetime import datetime

from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import Location as LocationModel
from ..models import Person
from ..models import User as UserModel
from ..models import UserRole


class UserList(APIView):
    def get(self, request, user_id=None):
        try:
            users = UserModel.objects.select_related('person', 'role', 'location')

            if user_id is not None:
                users = users.filter(user_id=user_id)

            if not users.exists():
                return Response({"error": "No Users found"}, status=404)

            result = []
            for user in users:
                result.append({
                    "user_id": user.user_id,
                    "username": user.username,
                    "status": user.status,
                    "role_id": user.role_id,
                    "location_id": user.location_id,
                    "person_id": user.person_id,
                    "Person": {
                        "person_id": user.person.person_id,
                        "first_name": user.person.first_name,
                        "last_name": user.person.last_name,
                        "contact": user.person.contact,
                        "email": user.person.email,
                        "address": user.person.address,
                    } if user.person else None,
                    "User_Role": {
                        "role_id": user.role.role_id,
                        "role_name": user.role.role_name,
                    } if user.role else None,
                    "Location": {
                        "location_id": user.location.location_id,
                        "location": user.location.location,
                    } if user.location else None,
                })

            return Response(result, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

    @transaction.atomic
    def post(self, request):
        data = request.data
        try:
            # Create Person
            person = Person.objects.create(
                first_name=data.get("first_name"),
                last_name=data.get("last_name"),
                contact=data.get("contact"),
                email=data.get("email"),
                address=data.get("address"),
            )

            password = data.get("password", "")
            role_id = data.get("role_id")
            location_id = data.get("location_id")

            # Generate username
            first = (data.get("first_name") or "").strip()
            last = (data.get("last_name") or "").strip()
            username = data.get("username") or f"{first.lower()}.{last.lower()}"

            hashed_password = make_password(password)

            user = UserModel.objects.create(
                person_id=person.person_id,
                username=username,
                password=hashed_password,
                role_id=role_id,
                location_id=location_id,
                status="Active",
            )

            return Response({
                "user_id": user.user_id,
                "username": user.username,
                "person_id": person.person_id,
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    @transaction.atomic
    def put(self, request, user_id):
        data = request.data
        try:
            try:
                user = UserModel.objects.get(user_id=user_id)
            except UserModel.DoesNotExist:
                return Response({"error": "User not found"}, status=404)

            # Update Person fields
            person_fields = ["first_name", "last_name", "contact", "email", "address"]
            person_data = {k: v for k, v in data.items() if k in person_fields and v is not None}
            if person_data and user.person_id:
                Person.objects.filter(person_id=user.person_id).update(**person_data)

            # Update User fields
            user_fields = ["username", "role_id", "location_id", "status"]
            user_data = {k: v for k, v in data.items() if k in user_fields and v is not None}

            # Handle password change
            if data.get("password"):
                user_data["password"] = make_password(data["password"])

            if user_data:
                UserModel.objects.filter(user_id=user_id).update(**user_data)

            user.refresh_from_db()
            return Response({
                "user_id": user.user_id,
                "username": user.username,
                "status": user.status,
            }, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

    def delete(self, request, user_id):
        try:
            deleted, _ = UserModel.objects.filter(user_id=user_id).delete()
            if deleted:
                return Response({"message": "User deleted successfully"}, status=204)
            return Response({"error": "User not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class UserLoginView(APIView):
    def post(self, request):
        try:
            username = request.data.get("username")
            password = request.data.get("password")

            if not username or not password:
                return Response({"error": "Username and password are required"}, status=400)

            # Fetch user with related data
            try:
                user = UserModel.objects.select_related('location', 'role').get(username=username)
            except UserModel.DoesNotExist:
                return Response({"error": "Invalid username or password"}, status=401)

            # Verify password
            if not check_password(password, user.password):
                return Response({"error": "Invalid username or password"}, status=401)

            # Get role name
            role_name = user.role.role_name if user.role else ""
            location_id = user.location_id
            location = user.location.location if user.location else ""

            # Generate JWT tokens
            refresh = RefreshToken()
            refresh["user_id"] = user.user_id
            refresh["username"] = user.username
            refresh["role_name"] = role_name
            refresh["location_id"] = location_id
            refresh["location"] = location
            refresh["status"] = user.status

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user_id": user.user_id,
                "username": user.username,
                "role_name": role_name,
                "location_id": location_id,
                "location": location,
                "status": user.status,
            }, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
