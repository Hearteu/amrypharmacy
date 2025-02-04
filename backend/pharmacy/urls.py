from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (Branch, Brand, Customers, CustomerType, DisposedItems,
                    DswdOrder, Expiration, Inventory, PersonList, Prescription,
                    ProductCategory, Products, Receipt, Supplier, UserList,
                    UserLoginView, UserRole)

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
]

# Generate urlpatterns dynamically
urlpatterns = [
<<<<<<< HEAD
    #First API endpoints are for getting and posting data to the database
    #Second API endpoints are for getting, updating, and deleting specific data from the database
    path('persons/', PersonList.as_view(), name='person-list'),
    path('persons/<int:person_id>/', PersonList.as_view(), name='get-person-list'),

    path('customer-types/', CustomerType.as_view(), name='customer-type-list'),
    path('customer-types/<int:customerType_id>/', CustomerType.as_view(), name='e-customer-type-list'),

    path('customers/', Customers.as_view(), name='customer-list'),
    path('customers/<int:customer_id>/', Customers.as_view(), name='e-customer-list'),

    path('users/', UserList.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserList.as_view(), name='get-user-list'),

    path('roles/', UserRole.as_view(), name='role-list'),
    path('roles/<int:role_id>/', UserRole.as_view(), name='get-role-list'),

    path('branches/', Branch.as_view(), name='branch-list'),
    path('branches/<int:branch_id>/', Branch.as_view(), name='edit-branch-list'),

    path('suppliers/', Supplier.as_view(), name='supplier-list'),
    path('suppliers/<int:supplier_id>/', Supplier.as_view(), name='edit-supplier-list'),

    path('products/', Products.as_view(), name='product-list'),
    path('products/<int:product_id>/', Products.as_view(), name='edit-product-list'),

    path('product-categories/', ProductCategory.as_view(), name='product-category-list'),
    path('product-categories/<int:category_id>/', ProductCategory.as_view(), name='edit-product-category-list'),

    path('brands/', Brand.as_view(), name='brand-list'),
    path('brands/<int:brand_id>/', Brand.as_view(), name='edit-brand-list'),

    #login
=======
    path(f"{name}/", view.as_view(), name=f"{name}-list") for name, view in resources
] + [
    path(f"{name}/<int:{name[:-1].replace('-', '_')}_id>/", view.as_view(), name=f"edit-{name}-list")
    for name, view in resources
] + [
>>>>>>> 1b5b9eb5c7e596e42e3b3b0ebec6bdeb1ed884d4
    path("login/", UserLoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
