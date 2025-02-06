from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView  # type: ignore

from .views import (Branch, Brand, Customers, CustomerType, DisposedItems,
                    DswdOrder, Expiration, Inventory, Order, PersonList,
                    Prescription, ProductCategory, Products, Receipt, Supplier,
                    UserList, UserLoginView, UserRole)

# Define resources with their corresponding view classes
resources = [
    ("persons", PersonList),
    ("customer-types", CustomerType),
    ("customers", Customers),
    ("disposed-items", DisposedItems),
    ("dswd-orders", DswdOrder),
    ("expirations", Expiration),
    ("inventories", Inventory),
    ("prescriptions", Prescription),
    ("receipts", Receipt),
    ("users", UserList),
    ("roles", UserRole),
    ("branches", Branch),
    ("suppliers", Supplier),
    ("products", Products),
    ("product-categories", ProductCategory),
    ("brands", Brand),
    ("orders", Order),
]

# Generate urlpatterns dynamically
urlpatterns = [
    path(f"{name}/", view.as_view(), name=f"{name}-list") for name, view in resources
] + [
    path(f"{name}/<int:{name[:-1].replace('-', '_')}_id>/", view.as_view(), name=f"edit-{name}-list")
    for name, view in resources
] + [
    path("login/", UserLoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]