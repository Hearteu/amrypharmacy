# views.py

from django.contrib.auth.hashers import check_password, make_password
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..supabase_client import get_supabase_client

supabase = get_supabase_client()

#Handling Input: You can access the individual fields in the request data (e.g., request.data['name'], request.data['email']) and use them in your logic (e.g., saving them to a database).

class UserList(APIView):
    def get(self, request):
        response = supabase.table('Users').select('*').execute()
        if response.data:
            return Response(response.data)
        else:
            return Response({"error": "No data found or query failed"}, status=400)
    
    def post(self, request):
        user_data = request.data.copy()  # Copy request data
        # Extract password separately
        password = user_data.pop("password", None)
        print("Data being sent to Person table:", user_data)  # Debugging
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
    # change this to hide instead of delete soon
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
        
        user_response = supabase.table("Users").select("user_id").eq("username", username).execute()
        
        if not user_response.data:
            return Response({"error": "User not found"}, status=404)

        user_id = user_response.data[0]["user_id"]

        # Fetch the user record from Supabase using both user_id and username
        response = supabase.table("Users").select("*").eq("user_id", user_id).eq("username", username).execute()

        if not response.data:
            return Response({"error": "User not found"}, status=404)

        user = response.data[0]  # Get the first user record

        if not check_password(password, user["password"]):
            return Response({"error": "Invalid password"}, status=400)

        refresh = RefreshToken()
        refresh["user_id"] = user["user_id"]
        refresh["username"] = user["username"]

        return Response({
            "user_id": user["user_id"],
            "username": user["username"],
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })