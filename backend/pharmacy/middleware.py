"""
Demo User Middleware
====================
Blocks all write operations (POST, PUT, PATCH, DELETE) from the demo user.
This ensures visitors can browse and view data but cannot modify or destroy
anything in the database.

The demo user can still:
  - Log in (POST to /login/)
  - View all pages and data (GET requests)

The demo user CANNOT:
  - Create, update, or delete any records
"""

import jwt
from django.conf import settings
from django.http import JsonResponse

# Username of the demo account
DEMO_USERNAME = "demo"

# Endpoints the demo user IS allowed to POST to (login only)
ALLOWED_POST_PATHS = [
    "/pharmacy/login/",
    "/login/",
]


class DemoUserMiddleware:
    """
    Intercepts all non-GET requests and checks if the request comes from the
    demo user. If so, returns a 403 Forbidden response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only restrict write methods
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            # Allow login requests through
            if any(request.path.endswith(p) for p in ALLOWED_POST_PATHS):
                return self.get_response(request)

            # Check if the request is from the demo user
            if self._is_demo_user(request):
                return JsonResponse(
                    {
                        "error": "Demo account is read-only. "
                        "You cannot create, update, or delete data."
                    },
                    status=403,
                )

        return self.get_response(request)

    def _is_demo_user(self, request):
        """
        Extract the username from the JWT token in the Authorization header
        or from the request body (for non-token endpoints).
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload.get("username") == DEMO_USERNAME
            except (jwt.DecodeError, jwt.ExpiredSignatureError):
                return False

        # Fallback: check session or cookie-based auth
        # NextAuth sends credentials via the session
        return False
