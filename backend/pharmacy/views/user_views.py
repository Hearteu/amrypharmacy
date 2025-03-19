# views.py

from django.contrib.auth.hashers import check_password, make_password
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class UserList(APIView):
    def get(self, request, user_id=None):
        try:
            query = supabase.table('Users').select('*')
            if user_id is not None:
                query = query.eq('user_id', user_id)
            
            response = query.execute()

            if not response.data:
                return Response({"error": "No Users found"}, status=404)

            return Response(response.data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    def post(self, request):
        user_data = request.data.copy()
        # Extract password separately
        password = user_data.pop("password", None)

        try:
            # Insert into Person table first
            person = supabase.table("Person").insert([user_data]).execute()
            
            if person.data and password:
                person_id = person.data[0]['person_id']  # Retrieve generated person_id
                first_name = user_data.get("first_name", "").strip()
                last_name = user_data.get("last_name", "").strip()
                # Generate initials for all first names
                first_initials = "".join([word[0] for word in first_name.split()]) if first_name else ""
                username = (first_initials + last_name).lower() if first_initials and last_name else f"user_{person_id}"

                hashed_password = make_password(password)

                user = supabase.table("Users").insert([{
                    "person_id": person_id,  # Reference person_id as person_id
                    "username": username,
                    "password": hashed_password
                }]).execute()

                return Response({"message": "User created successfully"}, status=201)
            
            return Response({"error": "Failed to create user"}, status=400)
        
        except Exception as e:
            print("Error:", str(e))
            return Response({"error": str(e)}, status=400)
    
    def put(self, request, user_id):
        print(request.data)
        request_data = request.data.copy()
        print("Request data", request_data)
        password = request_data.pop("password", None)

        user_fields = [
            "user_id",
            "username",
            "password",
            "person_id",
            "role_id",
        ]
        persons_fields = [
            "person_id",
            "first_name",
            "address",
            "contact",
            "email",
            "last_name",
        ]

        # Remove empty fields
        user_data = {
            k: v for k, v in request_data.items() if v != "" and k in user_fields
        }
        print("Person data", request_data.items())
        print("Person data", "first_name" in persons_fields, persons_fields)
        person_data = {
            k: v for k, v in request_data.items() if k in persons_fields
        }

        print(user_data)
        print(person_data)

        try:
            # Fetch person_id safely
            user_query = supabase.table("Users").select("person_id").eq("user_id", user_id).execute()
            if not user_query.data:
                return Response({"error": "User not found"}, status=404)

            person_id = user_query.data[0].get("person_id")
            if not person_id:
                return Response({"error": "Person ID not found"}, status=400)

            # Update Person table
            supabase.table("Person").update(person_data).eq("person_id", person_id).execute()

            # Generate username
            first_name = person_data.get("first_name", "").strip()
            last_name = person_data.get("last_name", "").strip()
            first_initials = "".join([word[0] for word in first_name.split()]) if first_name else ""
            username = (first_initials + last_name).lower() if first_initials and last_name else f"user_{user_id}"

            # Prepare user update data
            user_data["username"] = username
            if password:  # Only update password if provided
                user_data["password"] = make_password(password)

            # Update Users table
            user_update = supabase.table("Users").update(user_data).eq("user_id", user_id).execute()
            print(user_update)

            if user_update.data:
                return Response(user_update.data, status=200)
            else:
                return Response({"error": "Users not found or update failed"}, status=400)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, user_id):
        try:
            response = supabase.table("Users").delete().eq('user_id', user_id).execute()

            if response.data:
                return Response({"message": "Users deleted successfully"}, status=204)
            else:
                return Response({"error": "Users not found or deletion failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        

class UserLoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        # Fetch user details including role_id
        user_response = supabase.table("Users").select("user_id, password, role_id, username").eq("username", username).execute()
        
        if not user_response.data:
            return Response({"error": "User not found"}, status=404)

        user = user_response.data[0]  # Get the first user record

        if not check_password(password, user["password"]):
            return Response({"error": "Invalid password"}, status=400)

        # Fetch role_name using role_id
        role_response = supabase.table("User_Role").select("role_name").eq("role_id", user["role_id"]).execute()
        role_name = role_response.data[0]["role_name"] if role_response.data else None

        refresh = RefreshToken()
        refresh["user_id"] = user["user_id"]
        refresh["username"] = user["username"]
        refresh["role_name"] = role_name  # Add role_name to token

        return Response({
            "user_id": user["user_id"],
            "username": user["username"],
            "role_name": role_name,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })

    
    #not working yet
class ResetPassword(APIView):
    def put(self, request, user_id):
        user_data = request.data 
        if 'password' in user_data:
            user_data['password'] = make_password(user_data['password'])
        try:
            response = supabase.table("Users").update(user_data).eq('user_id', user_id).execute()

            if response.data:
                return Response(response.data, status=200)
            else:
                return Response({"error": "Users not found or update failed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
