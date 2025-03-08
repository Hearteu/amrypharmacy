from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView  # type: ignore

from .views import (POI, STI, Branch, Brand, Customers, CustomerType,
                    DisposedItems, Drugs, DswdOrder, Expiration, Inventory,
                    Location, Order, PersonList, Prescription, PriceHistory,
                    ProductCategory, Products, Purchase_Order_Item_Status,
                    Purchase_Order_Status, PurchaseOrder, Receipt, Status,
                    Stock_Transfer_Item_Status, Stock_Transfer_Status,
                    StockTransaction, StockTransfer, Supplier, SupplierItem,
                    Unit, UserList, UserLoginView, UserRole)

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
    ("purchase-orders", PurchaseOrder),
    ("stock-transfers", StockTransfer),
    ("unit", Unit),
    ("price-histories", PriceHistory),
    ("drugs", Drugs),
    ("status", Status),
    ("supplier-items", SupplierItem),
    ("purchase-order-status", Purchase_Order_Status),
    ("purchase-order-item-status", Purchase_Order_Item_Status),
    ("stock-transactions", StockTransaction),
    ("purchase-order-items", POI),
    ("locations", Location),
    ("stock-transfer-items", STI),
    ("stock-transfer-status", Stock_Transfer_Status),
    ("stock-transfer-item-status", Stock_Transfer_Item_Status),
    ("stock-transfers", StockTransfer),
]

# Generate urlpatterns dynamically
urlpatterns = [
    path(f"{name}/", view.as_view(), name=f"{name}-list") for name, view in resources
] + [
    path(f"{name}/<int:product_id>/", view.as_view(), name=f"edit-{name}-list") if name == "products" else
    path(f"{name}/<int:unit_id>/", view.as_view(), name=f"edit-{name}-list") if name == "unit" else
    path(f"{name}/<int:category_id>/", view.as_view(), name=f"edit-{name}-list") if name == "product-categories" else
    path(f"{name}/<int:status_id>/", view.as_view(), name=f"edit-{name}-list") if name == "status" else
    path(f"{name}/<int:supplier_id>/", view.as_view(), name=f"get-{name}-list") if name == "supplier-items" else
    path(f"{name}/<int:purchase_order_status_id>/", view.as_view(), name=f"get-{name}-list") if name == "purchase-order-status" else
    path(f"{name}/<int:purchase_order_item_status_id>/", view.as_view(), name=f"get-{name}-list") if name == "purchase-order-item-status" else
    path(f"{name}/<int:stock_transfer_status_id>/", view.as_view(), name=f"get-{name}-list") if name == "stock-transfer-status" else
    path(f"{name}/<int:stock_transfer_item_status_id>/", view.as_view(), name=f"get-{name}-list") if name == "stock-transfer-item-status" else
    path(f"{name}/<int:{name[:-1].replace('-', '_')}_id>/", view.as_view(), name=f"edit-{name}-list")
    for name, view in resources
] + [
    # Explicitly define PUT route for supplier-items
    path("supplier-items/edit/<int:supplier_item_id>/", SupplierItem.as_view(), name="edit-supplier-item"),
] + [
    path("login/", UserLoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]

