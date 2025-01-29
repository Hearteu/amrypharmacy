# urls.py
from django.urls import path
from .views import UserList, UserLoginView, PersonList, Supplier, UserList, UserRole
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('persons/', PersonList.as_view(), name='person-list'),
    path('users/', UserList.as_view(), name='user-list'),
    path('roles/', UserRole.as_view(), name='role-list'),
    path('suppliers/', Supplier.as_view(), name='supplier-list'),

    #login
    path("login/", UserLoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
