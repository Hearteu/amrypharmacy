# urls.py
from django.urls import path

from .views import PersonList, Supplier, UserList, UserRole

urlpatterns = [
    path('persons/', PersonList.as_view(), name='person-list'),
    path('users/', UserList.as_view(), name='user-list'),
    path('roles/', UserRole.as_view(), name='role-list'),
    path('suppliers/', Supplier.as_view(), name='supplier-list'),
]
