# urls.py
from django.urls import path

from .views import PersonList, UserList

urlpatterns = [
    path('persons/', PersonList.as_view(), name='person-list'),
    path('users/', UserList.as_view(), name='user-list'),
]
