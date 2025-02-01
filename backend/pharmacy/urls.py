# urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (PersonList, ProductCategory, Supplier, UserList,
                    UserLoginView, UserRole)

urlpatterns = [
    path('persons/', PersonList.as_view(), name='person-list'),
    path('users/', UserList.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserList.as_view(), name='update-user-role'),
    
    path('roles/', UserRole.as_view(), name='role-list'),
    path('suppliers/', Supplier.as_view(), name='supplier-list'),
    path('product-categories/', ProductCategory.as_view(), name='product-category-list'),

    #login
    path("login/", UserLoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
