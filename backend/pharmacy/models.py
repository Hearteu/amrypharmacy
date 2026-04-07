from django.db import models


class Person(models.Model):
    person_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    contact = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Person'

    def __str__(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip()


class Status(models.Model):
    status_id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=100)

    class Meta:
        db_table = 'Status'

    def __str__(self):
        return self.status


class UserRole(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=100)

    class Meta:
        db_table = 'User_Role'

    def __str__(self):
        return self.role_name


class Location(models.Model):
    location_id = models.AutoField(primary_key=True)
    location = models.CharField(max_length=255)

    class Meta:
        db_table = 'Location'

    def __str__(self):
        return self.location


class Unit(models.Model):
    unit_id = models.AutoField(primary_key=True)
    unit = models.CharField(max_length=100)

    class Meta:
        db_table = 'Unit'

    def __str__(self):
        return self.unit


class Brand(models.Model):
    brand_id = models.AutoField(primary_key=True)
    brand_name = models.CharField(max_length=255)

    class Meta:
        db_table = 'Brand'

    def __str__(self):
        return self.brand_name


class ProductCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=255)

    class Meta:
        db_table = 'Product_Category'

    def __str__(self):
        return self.category_name


class Branch(models.Model):
    branch_id = models.AutoField(primary_key=True)
    branch_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Branch'

    def __str__(self):
        return self.branch_name or f"Branch {self.branch_id}"


class CustomerType(models.Model):
    customer_type_id = models.AutoField(primary_key=True)
    description = models.CharField(max_length=255)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        db_table = 'Customer_Type'

    def __str__(self):
        return self.description


# ── Users, Customers, Suppliers, Physicians ──────────────────────────

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    person = models.ForeignKey(Person, on_delete=models.CASCADE, db_column='person_id')
    role = models.ForeignKey(UserRole, on_delete=models.SET_NULL, null=True, db_column='role_id')
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, db_column='location_id')
    username = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='Active')

    class Meta:
        db_table = 'Users'

    def __str__(self):
        return self.username


class Customer(models.Model):
    customer_id = models.AutoField(primary_key=True)
    person = models.ForeignKey(Person, on_delete=models.CASCADE, db_column='person_id')
    customer_type = models.ForeignKey(CustomerType, on_delete=models.SET_NULL, null=True, db_column='customer_type_id')
    id_card_number = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'Customers'

    def __str__(self):
        return f"Customer {self.customer_id}"


class Supplier(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    supplier_name = models.CharField(max_length=255)
    person = models.ForeignKey(Person, on_delete=models.CASCADE, db_column='person_id')
    vat_num = models.CharField(max_length=100, blank=True, null=True)
    status = models.ForeignKey(Status, on_delete=models.SET_NULL, null=True, db_column='status_id')

    class Meta:
        db_table = 'Supplier'

    def __str__(self):
        return self.supplier_name


class Physician(models.Model):
    physician_id = models.AutoField(primary_key=True)
    person = models.ForeignKey(Person, on_delete=models.CASCADE, db_column='person_id')
    prc_num = models.CharField(max_length=100, blank=True, null=True)
    ptr_num = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'Physician'

    def __str__(self):
        return f"Dr. {self.person}"


# ── Products ─────────────────────────────────────────────────────────

class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=255)
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, db_column='category_id')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, db_column='brand_id')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, db_column='unit_id')
    current_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_content = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Products'

    def __str__(self):
        return self.product_name


class Drug(models.Model):
    drug_id = models.AutoField(primary_key=True)
    product = models.OneToOneField(Product, on_delete=models.CASCADE, db_column='product_id', related_name='drug')
    dosage_strength = models.CharField(max_length=255, blank=True, null=True)
    dosage_form = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Drugs'

    def __str__(self):
        return f"{self.product.product_name} {self.dosage_strength or ''}"


# ── Stock Management ─────────────────────────────────────────────────

class StockItem(models.Model):
    stock_item_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id', related_name='stock_items')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, db_column='location_id')
    quantity = models.IntegerField(default=0)

    class Meta:
        db_table = 'Stock_Item'
        unique_together = ('product', 'location')

    def __str__(self):
        return f"{self.product.product_name} @ {self.location.location} ({self.quantity})"


class Expiration(models.Model):
    expiration_id = models.AutoField(primary_key=True)
    stock_item = models.ForeignKey(StockItem, on_delete=models.CASCADE, db_column='stock_item_id', related_name='expirations')
    expiry_date = models.DateField()
    quantity = models.IntegerField(default=0)

    class Meta:
        db_table = 'Expiration'

    def __str__(self):
        return f"Exp {self.expiry_date} qty={self.quantity}"


class PriceHistory(models.Model):
    price_history_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id')
    old_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    new_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    date_changed = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Price_History'

    def __str__(self):
        return f"{self.product} price change"


# ── Supplier Items ───────────────────────────────────────────────────

class SupplierItem(models.Model):
    supplier_item_id = models.AutoField(primary_key=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, db_column='supplier_id', related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id')
    supplier_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'Supplier_Item'

    def __str__(self):
        return f"{self.supplier.supplier_name} - {self.product.product_name}"


# ── Purchase Orders ──────────────────────────────────────────────────

class PurchaseOrderStatus(models.Model):
    purchase_order_status_id = models.AutoField(primary_key=True)
    purchase_order_status = models.CharField(max_length=100)

    class Meta:
        db_table = 'Purchase_Order_Status'

    def __str__(self):
        return self.purchase_order_status


class PurchaseOrderItemStatus(models.Model):
    purchase_order_item_status_id = models.AutoField(primary_key=True)
    po_item_status = models.CharField(max_length=100)

    class Meta:
        db_table = 'Purchase_Order_Item_Status'

    def __str__(self):
        return self.po_item_status


class PurchaseOrder(models.Model):
    purchase_order_id = models.AutoField(primary_key=True)
    po_id = models.CharField(max_length=50, unique=True)  # e.g., PO-2026-001
    order_date = models.DateField()
    expected_delivery_date = models.DateField(blank=True, null=True)
    purchase_order_status = models.ForeignKey(
        PurchaseOrderStatus, on_delete=models.SET_NULL, null=True,
        db_column='purchase_order_status_id'
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Purchase_Order'

    def __str__(self):
        return self.po_id


class PurchaseOrderItem(models.Model):
    purchase_order_item_id = models.AutoField(primary_key=True)
    poi_id = models.CharField(max_length=50, blank=True, null=True)  # e.g., POI-001-01
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE,
        db_column='purchase_order_id', related_name='items'
    )
    supplier_item = models.ForeignKey(
        SupplierItem, on_delete=models.CASCADE,
        db_column='supplier_item_id'
    )
    ordered_qty = models.IntegerField(default=0)
    received_qty = models.IntegerField(default=0)
    expired_qty = models.IntegerField(default=0)
    damaged_qty = models.IntegerField(default=0)
    expiry_date = models.DateField(blank=True, null=True)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, db_column='unit_id')
    purchase_order_item_status = models.ForeignKey(
        PurchaseOrderItemStatus, on_delete=models.SET_NULL, null=True,
        db_column='purchase_order_item_status_id'
    )

    class Meta:
        db_table = 'Purchase_Order_Item'

    def __str__(self):
        return self.poi_id or f"POI-{self.purchase_order_item_id}"


# ── Stock Transfers ──────────────────────────────────────────────────

class StockTransferStatus(models.Model):
    stock_transfer_status_id = models.AutoField(primary_key=True)
    stock_transfer_status = models.CharField(max_length=100)

    class Meta:
        db_table = 'Stock_Transfer_Status'

    def __str__(self):
        return self.stock_transfer_status


class StockTransferItemStatus(models.Model):
    stock_transfer_item_status_id = models.AutoField(primary_key=True)
    stock_transfer_item_status = models.CharField(max_length=100)

    class Meta:
        db_table = 'Stock_Transfer_Item_Status'

    def __str__(self):
        return self.stock_transfer_item_status


class StockTransfer(models.Model):
    stock_transfer_id = models.AutoField(primary_key=True)
    transfer_id = models.CharField(max_length=50, unique=True)  # e.g., ST-2026-001
    transfer_date = models.DateField(blank=True, null=True)
    stock_transfer_status = models.ForeignKey(
        StockTransferStatus, on_delete=models.SET_NULL, null=True,
        db_column='stock_transfer_status_id'
    )
    src_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True,
        db_column='src_location', related_name='transfers_out'
    )
    des_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True,
        db_column='des_location', related_name='transfers_in'
    )

    class Meta:
        db_table = 'Stock_Transfer'

    def __str__(self):
        return self.transfer_id


class StockTransferItem(models.Model):
    stock_transfer_item_id = models.AutoField(primary_key=True)
    sti_id = models.CharField(max_length=50, blank=True, null=True)  # e.g., STI-001-01
    stock_transfer = models.ForeignKey(
        StockTransfer, on_delete=models.CASCADE,
        db_column='stock_transfer_id', related_name='items'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id')
    ordered_quantity = models.IntegerField(default=0)
    transferred_qty = models.IntegerField(default=0)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, db_column='unit_id')
    stock_transfer_item_status = models.ForeignKey(
        StockTransferItemStatus, on_delete=models.SET_NULL, null=True,
        db_column='stock_transfer_item_status_id'
    )

    class Meta:
        db_table = 'Stock_Transfer_Item'

    def __str__(self):
        return self.sti_id or f"STI-{self.stock_transfer_item_id}"


# ── Stock Transactions (Audit Log) ───────────────────────────────────

class StockTransaction(models.Model):
    stock_transaction_id = models.AutoField(primary_key=True)
    stock_item = models.ForeignKey(
        StockItem, on_delete=models.CASCADE,
        db_column='stock_item_id', blank=True, null=True
    )
    transaction_date = models.DateTimeField(blank=True, null=True)
    transaction_type = models.CharField(max_length=100)  # POS, POI, Transfer, Expired Item Disposal
    quantity_change = models.IntegerField(default=0)
    reference_id = models.IntegerField(blank=True, null=True)
    src_location = models.IntegerField(blank=True, null=True)
    des_location = models.IntegerField(blank=True, null=True)
    disposed_date = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'Stock_Transaction'

    def __str__(self):
        return f"{self.transaction_type} ({self.quantity_change})"


# ── Cash & Shift Management ──────────────────────────────────────────

class CashShift(models.Model):
    shift_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, db_column='location_id')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(blank=True, null=True)
    starting_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expected_ending_cash = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    ending_cash = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, default='OPEN') # OPEN, CLOSED
    
    class Meta:
        db_table = 'Cash_Shift'

    def __str__(self):
        return f"Shift {self.shift_id} - {self.user.username}"


class CashMovement(models.Model):
    movement_id = models.AutoField(primary_key=True)
    shift = models.ForeignKey(CashShift, on_delete=models.CASCADE, db_column='shift_id', related_name='movements')
    movement_type = models.CharField(max_length=10) # IN, OUT
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Cash_Movement'
        
    def __str__(self):
        return f"{self.movement_type} {self.amount} - {self.reason}"


# ── POS (Point of Sale) ─────────────────────────────────────────────

class Prescription(models.Model):
    prescription_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, db_column='customer_id')
    physician = models.ForeignKey(Physician, on_delete=models.SET_NULL, null=True, db_column='physician_id')
    prescription_details = models.TextField(blank=True, null=True)
    date_issued = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'Prescription'

    def __str__(self):
        return f"Prescription {self.prescription_id}"


class POS(models.Model):
    pos_id = models.AutoField(primary_key=True)
    sale_date = models.DateTimeField(blank=True, null=True)
    invoice = models.CharField(max_length=50, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='user_id')
    order_type = models.CharField(max_length=100, blank=True, null=True)
    payment_method = models.CharField(max_length=50, default='Cash')
    payment_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prescription = models.ForeignKey(
        Prescription, on_delete=models.SET_NULL, null=True, blank=True,
        db_column='prescription_id'
    )
    shift = models.ForeignKey(
        CashShift, on_delete=models.SET_NULL, null=True, blank=True, db_column='shift_id'
    )

    class Meta:
        db_table = 'POS'

    def __str__(self):
        return self.invoice or f"POS-{self.pos_id}"


class POSItem(models.Model):
    pos_item_id = models.AutoField(primary_key=True)
    pos = models.ForeignKey(POS, on_delete=models.CASCADE, db_column='pos_id', related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id')
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_sold = models.IntegerField(default=0)

    class Meta:
        db_table = 'POS_Item'

    def __str__(self):
        return f"POS Item {self.pos_item_id}"


class DswdOrder(models.Model):
    dswd_order_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, db_column='customer_id')
    pos = models.ForeignKey(POS, on_delete=models.SET_NULL, null=True, db_column='pos_id')
    gl_num = models.CharField(max_length=100, blank=True, null=True)
    gl_date = models.DateField(blank=True, null=True)
    claim_date = models.DateField(blank=True, null=True)
    client_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Dswd_Order'

    def __str__(self):
        return f"DSWD Order {self.dswd_order_id}"


# ── Misc Tables ──────────────────────────────────────────────────────

class Receipt(models.Model):
    receipt_id = models.AutoField(primary_key=True)
    # Receipt fields are generic — the view uses insert(data) directly
    receipt_date = models.DateField(blank=True, null=True)
    receipt_number = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'Receipt'

    def __str__(self):
        return f"Receipt {self.receipt_id}"


class DisposedItem(models.Model):
    disposed_item_id = models.AutoField(primary_key=True)
    stock_item = models.ForeignKey(StockItem, on_delete=models.CASCADE, db_column='stock_item_id', blank=True, null=True)
    quantity = models.IntegerField(default=0)
    disposal_date = models.DateField(blank=True, null=True)
    reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Disposed_Items'

    def __str__(self):
        return f"Disposed {self.quantity} on {self.disposal_date}"


class Inventory(models.Model):
    inventory_id = models.AutoField(primary_key=True)
    stock_item = models.ForeignKey(StockItem, on_delete=models.CASCADE, db_column='stock_item_id', blank=True, null=True)
    counted_quantity = models.IntegerField(default=0)
    audit_date = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'Inventory'

    def __str__(self):
        return f"Inventory Audit {self.inventory_id}"


class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    order_date = models.DateField(blank=True, null=True)
    order_details = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Order'

    def __str__(self):
        return f"Order {self.order_id}"
