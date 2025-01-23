# urls.py
from django.urls import path

from .views import PersonList

urlpatterns = [
    path('persons/', PersonList.as_view(), name='person-list'),
]
