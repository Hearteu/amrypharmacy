"""
Seed command — populates the database with comprehensive demo data.

Usage:
    python manage.py seed          # Seed everything
    python manage.py seed --reset  # Wipe all tables first, then seed
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
import random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.utils import timezone

from pharmacy.models import (
    Brand,
    Branch,
    Customer,
    CustomerType,
    DisposedItem,
    Drug,
    DswdOrder,
    Expiration,
    Inventory,
    Location,
    Order,
    Person,
    Physician,
    POS,
    POSItem,
    Prescription,
    PriceHistory,
    Product,
    ProductCategory,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderItemStatus,
    PurchaseOrderStatus,
    Receipt,
    Status,
    StockItem,
    StockTransaction,
    StockTransfer,
    StockTransferItem,
    StockTransferItemStatus,
    StockTransferStatus,
    Supplier,
    SupplierItem,
    Unit,
    User,
    UserRole,
)


class Command(BaseCommand):
    help = "Seed the database with comprehensive demo data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Clear existing data before seeding",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write("🗑️  Clearing all data...")
            self._clear_all()

        self.stdout.write("🌱 Seeding database...")
        self._seed()
        self.stdout.write(self.style.SUCCESS("✅ Database seeded successfully!"))

    # ── Clear ─────────────────────────────────────────────────────

    def _clear_all(self):
        models = [
            Receipt, DisposedItem, Inventory, DswdOrder,
            POSItem, POS, StockTransaction, Expiration,
            PurchaseOrderItem, PurchaseOrder,
            StockTransferItem, StockTransfer,
            SupplierItem, StockItem, Drug, PriceHistory, Product,
            Prescription, Physician, Supplier, Customer,
            User, Person, Order,
            Brand, Unit, ProductCategory, Location,
            UserRole, Status, CustomerType, Branch,
            PurchaseOrderStatus, PurchaseOrderItemStatus,
            StockTransferStatus, StockTransferItemStatus,
        ]
        for m in models:
            m.objects.all().delete()

    # ── Seed ──────────────────────────────────────────────────────

    def _seed(self):
        today = date.today()
        now = timezone.now()

        # ══════════════════════════════════════════════════════════
        # LOOKUP TABLES
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📋 Creating lookup tables...")

        status_active, _ = Status.objects.get_or_create(status="Active")
        status_inactive, _ = Status.objects.get_or_create(status="Inactive")

        role_admin, _ = UserRole.objects.get_or_create(role_name="Admin")
        role_pharmacist, _ = UserRole.objects.get_or_create(role_name="Pharmacist")
        role_cashier, _ = UserRole.objects.get_or_create(role_name="Cashier")
        role_staff, _ = UserRole.objects.get_or_create(role_name="Staff")

        loc_main, _ = Location.objects.get_or_create(location="Main Branch")
        loc_branch2, _ = Location.objects.get_or_create(location="Branch 2")
        loc_warehouse, _ = Location.objects.get_or_create(location="Warehouse")
        locations = [loc_main, loc_branch2, loc_warehouse]

        Branch.objects.get_or_create(branch_name="Main Branch")
        Branch.objects.get_or_create(branch_name="Branch 2")

        unit_pc, _ = Unit.objects.get_or_create(unit="Piece")
        unit_box, _ = Unit.objects.get_or_create(unit="Box")
        unit_bot, _ = Unit.objects.get_or_create(unit="Bottle")
        unit_tab, _ = Unit.objects.get_or_create(unit="Tablet")
        unit_cap, _ = Unit.objects.get_or_create(unit="Capsule")
        unit_tube, _ = Unit.objects.get_or_create(unit="Tube")
        unit_sachet, _ = Unit.objects.get_or_create(unit="Sachet")

        # Brands — common Philippine pharmacy brands
        brands = {}
        brand_names = [
            "Biogesic", "Neozep", "Alaxan", "Medicol", "Bioflu",
            "Solmux", "Decolgen", "Diatabs", "Ponstan", "Unilab",
            "Clusivol", "Enervon", "Centrum", "Ascof Lagundi",
            "Robitussin", "Bactidol", "Betadine", "Efficascent",
            "Omega Pain Killer", "White Flower", "RiteMed",
            "TGP Generics", "Mercury Drug Generics", "Myra-E",
        ]
        for bn in brand_names:
            brands[bn], _ = Brand.objects.get_or_create(brand_name=bn)

        cat_otc, _ = ProductCategory.objects.get_or_create(category_name="Over-the-Counter")
        cat_rx, _ = ProductCategory.objects.get_or_create(category_name="Prescription Drug")
        cat_supplement, _ = ProductCategory.objects.get_or_create(category_name="Supplement")
        cat_personal, _ = ProductCategory.objects.get_or_create(category_name="Personal Care")
        cat_medical, _ = ProductCategory.objects.get_or_create(category_name="Medical Supplies")

        ct_regular, _ = CustomerType.objects.get_or_create(
            description="Regular", defaults={"discount": Decimal("0.00")}
        )
        ct_senior, _ = CustomerType.objects.get_or_create(
            description="Senior Citizen", defaults={"discount": Decimal("20.00")}
        )
        ct_pwd, _ = CustomerType.objects.get_or_create(
            description="PWD", defaults={"discount": Decimal("20.00")}
        )
        ct_employee, _ = CustomerType.objects.get_or_create(
            description="Employee", defaults={"discount": Decimal("10.00")}
        )

        # Purchase Order / Stock Transfer Statuses
        po_pending, _ = PurchaseOrderStatus.objects.get_or_create(purchase_order_status="Pending")
        po_approved, _ = PurchaseOrderStatus.objects.get_or_create(purchase_order_status="Approved")
        po_received, _ = PurchaseOrderStatus.objects.get_or_create(purchase_order_status="Received")
        po_cancelled, _ = PurchaseOrderStatus.objects.get_or_create(purchase_order_status="Cancelled")

        poi_pending, _ = PurchaseOrderItemStatus.objects.get_or_create(po_item_status="Pending")
        poi_received, _ = PurchaseOrderItemStatus.objects.get_or_create(po_item_status="Received")
        poi_partial, _ = PurchaseOrderItemStatus.objects.get_or_create(po_item_status="Partially Received")

        st_pending, _ = StockTransferStatus.objects.get_or_create(stock_transfer_status="Pending")
        st_completed, _ = StockTransferStatus.objects.get_or_create(stock_transfer_status="Completed")
        st_cancelled, _ = StockTransferStatus.objects.get_or_create(stock_transfer_status="Cancelled")

        sti_pending, _ = StockTransferItemStatus.objects.get_or_create(stock_transfer_item_status="Pending")
        sti_transferred, _ = StockTransferItemStatus.objects.get_or_create(stock_transfer_item_status="Transferred")

        # ══════════════════════════════════════════════════════════
        # USERS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  👤 Creating users...")

        users_data = [
            ("Demo", "User", "demo", "demo123", role_admin, loc_main, "09171234567", "demo@amrypharmacy.com"),
            ("Admin", "Amry", "admin", "admin123", role_admin, loc_main, "09181234567", "admin@amrypharmacy.com"),
            ("Maria", "Santos", "maria", "maria123", role_cashier, loc_main, "09191234567", "maria@amrypharmacy.com"),
            ("Juan", "Dela Cruz", "juan", "juan123", role_pharmacist, loc_main, "09201234567", "juan@amrypharmacy.com"),
            ("Rosa", "Garcia", "rosa", "rosa123", role_cashier, loc_branch2, "09211234567", "rosa@amrypharmacy.com"),
            ("Pedro", "Reyes", "pedro", "pedro123", role_pharmacist, loc_branch2, "09221234567", "pedro@amrypharmacy.com"),
            ("Ana", "Mendoza", "ana", "ana123", role_staff, loc_warehouse, "09231234567", "ana@amrypharmacy.com"),
        ]

        users = []
        for fname, lname, uname, pwd, role, loc, contact, email in users_data:
            person, _ = Person.objects.get_or_create(
                first_name=fname, last_name=lname,
                defaults={"contact": contact, "email": email}
            )
            user, _ = User.objects.get_or_create(
                username=uname,
                defaults={
                    "person": person, "role": role, "location": loc,
                    "password": make_password(pwd), "status": "Active",
                }
            )
            users.append(user)

        cashier_user = users[2]  # Maria
        pharmacist_user = users[3]  # Juan

        # ══════════════════════════════════════════════════════════
        # SUPPLIERS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🏭 Creating suppliers...")

        suppliers_data = [
            ("Mercury Drug Corporation", "Carlos", "Tan", "09301111111", "carlos@mercurydrug.com", "VAT-MD-2024-001"),
            ("Unilab Inc.", "Elena", "Villanueva", "09302222222", "elena@unilab.com", "VAT-UL-2024-002"),
            ("Generics Pharmacy Distribution", "Miguel", "Aquino", "09303333333", "miguel@generics.com", "VAT-GP-2024-003"),
            ("Pascual Laboratories", "Teresa", "Lorenzo", "09304444444", "teresa@pascual.com", "VAT-PL-2024-004"),
            ("PhilPharma Corporation", "Roberto", "Navarro", "09305555555", "roberto@philpharma.com", "VAT-PP-2024-005"),
            ("Metro Drug Inc.", "Gloria", "Fernandez", "09306666666", "gloria@metrodrug.com", "VAT-MDI-2024-006"),
            ("Zuellig Pharma", "Antonio", "Bautista", "09307777777", "antonio@zuellig.com", "VAT-ZP-2024-007"),
        ]

        suppliers = []
        for sname, fname, lname, contact, email, vat in suppliers_data:
            person, _ = Person.objects.get_or_create(
                first_name=fname, last_name=lname,
                defaults={"contact": contact, "email": email, "address": f"{sname} Headquarters, Manila"}
            )
            supplier, _ = Supplier.objects.get_or_create(
                supplier_name=sname,
                defaults={"person": person, "vat_num": vat, "status": status_active}
            )
            suppliers.append(supplier)

        # ══════════════════════════════════════════════════════════
        # PHYSICIANS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🩺 Creating physicians...")

        physicians_data = [
            ("Jose", "Rizal", "PRC-2024-12345", "PTR-2024-54321", "09401111111"),
            ("Maria", "Clara", "PRC-2024-67890", "PTR-2024-09876", "09402222222"),
            ("Emilio", "Aguinaldo", "PRC-2024-11223", "PTR-2024-33211", "09403333333"),
            ("Gabriela", "Silang", "PRC-2024-44556", "PTR-2024-65544", "09404444444"),
            ("Apolinario", "Mabini", "PRC-2024-77889", "PTR-2024-98877", "09405555555"),
        ]
        physicians = []
        for fname, lname, prc, ptr, contact in physicians_data:
            person, _ = Person.objects.get_or_create(
                first_name=fname, last_name=lname,
                defaults={"contact": contact}
            )
            physician, _ = Physician.objects.get_or_create(
                person=person, defaults={"prc_num": prc, "ptr_num": ptr}
            )
            physicians.append(physician)

        # ══════════════════════════════════════════════════════════
        # CUSTOMERS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🧑 Creating customers...")

        customers_data = [
            ("Roberto", "Cruz", ct_regular, None, "09501111111"),
            ("Lourdes", "Bautista", ct_senior, "SC-2024-001", "09502222222"),
            ("Ricardo", "Ramos", ct_pwd, "PWD-2024-001", "09503333333"),
            ("Dolores", "Pascual", ct_senior, "SC-2024-002", "09504444444"),
            ("Fernando", "Aguilar", ct_regular, None, "09505555555"),
            ("Carmela", "Valdez", ct_employee, "EMP-2024-001", "09506666666"),
            ("Benjamin", "Soriano", ct_regular, None, "09507777777"),
            ("Leonora", "Dizon", ct_senior, "SC-2024-003", "09508888888"),
            ("Ernesto", "Manalo", ct_pwd, "PWD-2024-002", "09509999999"),
            ("Patricia", "Gutierrez", ct_regular, None, "09510000000"),
        ]
        customers = []
        for fname, lname, ctype, card, contact in customers_data:
            person, _ = Person.objects.get_or_create(
                first_name=fname, last_name=lname,
                defaults={"contact": contact, "address": f"{fname} St., Quezon City"}
            )
            customer, _ = Customer.objects.get_or_create(
                person=person,
                defaults={"customer_type": ctype, "id_card_number": card}
            )
            customers.append(customer)

        # ══════════════════════════════════════════════════════════
        # PRODUCTS (40 realistic Philippine pharmacy products)
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  💊 Creating products...")

        products_data = [
            # (name, category, brand, unit, price, net_content, dosage_strength, dosage_form)
            # OTC Pain & Fever
            ("Biogesic 500mg Tablet", cat_otc, brands["Biogesic"], unit_tab, "7.50", "10 tablets", "500mg", "Tablet"),
            ("Biogesic Forte 650mg", cat_otc, brands["Biogesic"], unit_tab, "9.00", "10 tablets", "650mg", "Tablet"),
            ("Alaxan FR Capsule", cat_otc, brands["Alaxan"], unit_cap, "10.00", "10 capsules", "200mg/325mg", "Capsule"),
            ("Medicol Advance 400mg", cat_otc, brands["Medicol"], unit_cap, "11.50", "10 capsules", "400mg", "Capsule"),
            ("Medicol Advance 200mg", cat_otc, brands["Medicol"], unit_cap, "8.50", "10 capsules", "200mg", "Capsule"),
            ("Ponstan 500mg", cat_rx, brands["Ponstan"], unit_cap, "15.00", "10 capsules", "500mg", "Capsule"),
            ("Ponstan 250mg", cat_rx, brands["Ponstan"], unit_cap, "12.00", "10 capsules", "250mg", "Capsule"),
            # Cold & Flu
            ("Neozep Forte Capsule", cat_otc, brands["Neozep"], unit_cap, "9.00", "10 capsules", "500mg/2mg/25mg", "Capsule"),
            ("Neozep Non-Drowsy", cat_otc, brands["Neozep"], unit_tab, "10.00", "10 tablets", "500mg/25mg/2mg", "Tablet"),
            ("Bioflu Tablet", cat_otc, brands["Bioflu"], unit_tab, "12.00", "10 tablets", "500mg/2mg/25mg", "Tablet"),
            ("Decolgen Forte Tablet", cat_otc, brands["Decolgen"], unit_tab, "8.50", "10 tablets", "500mg/2mg/25mg", "Tablet"),
            # Cough
            ("Solmux 500mg Capsule", cat_otc, brands["Solmux"], unit_cap, "14.00", "10 capsules", "500mg", "Capsule"),
            ("Solmux Syrup 60mL", cat_otc, brands["Solmux"], unit_bot, "95.00", "60mL", "250mg/5mL", "Syrup"),
            ("Ascof Lagundi Syrup", cat_otc, brands["Ascof Lagundi"], unit_bot, "110.00", "120mL", "300mg/5mL", "Syrup"),
            ("Robitussin DM Syrup", cat_otc, brands["Robitussin"], unit_bot, "175.00", "120mL", "100mg/5mL", "Syrup"),
            # Stomach / Digestive
            ("Diatabs 2mg Tablet", cat_otc, brands["Diatabs"], unit_tab, "6.00", "4 tablets", "2mg", "Tablet"),
            ("Kremil-S Tablet", cat_otc, brands["RiteMed"], unit_tab, "7.00", "10 tablets", None, "Chewable Tablet"),
            # Prescription Drugs
            ("Amoxicillin 500mg", cat_rx, brands["RiteMed"], unit_cap, "12.50", "10 capsules", "500mg", "Capsule"),
            ("Amoxicillin 250mg", cat_rx, brands["RiteMed"], unit_cap, "9.00", "10 capsules", "250mg", "Capsule"),
            ("Cetirizine 10mg", cat_rx, brands["TGP Generics"], unit_tab, "5.00", "10 tablets", "10mg", "Tablet"),
            ("Omeprazole 20mg", cat_rx, brands["TGP Generics"], unit_cap, "7.00", "10 capsules", "20mg", "Capsule"),
            ("Losartan 50mg", cat_rx, brands["RiteMed"], unit_tab, "9.00", "30 tablets", "50mg", "Tablet"),
            ("Metformin 500mg", cat_rx, brands["RiteMed"], unit_tab, "6.50", "30 tablets", "500mg", "Tablet"),
            ("Amlodipine 5mg", cat_rx, brands["TGP Generics"], unit_tab, "5.50", "30 tablets", "5mg", "Tablet"),
            ("Metoprolol 50mg", cat_rx, brands["RiteMed"], unit_tab, "7.50", "30 tablets", "50mg", "Tablet"),
            ("Co-Amoxiclav 625mg", cat_rx, brands["Unilab"], unit_tab, "35.00", "10 tablets", "625mg", "Tablet"),
            ("Ciprofloxacin 500mg", cat_rx, brands["Mercury Drug Generics"], unit_tab, "18.00", "10 tablets", "500mg", "Tablet"),
            ("Loperamide 2mg", cat_otc, brands["Diatabs"], unit_cap, "5.50", "4 capsules", "2mg", "Capsule"),
            # Supplements
            ("Enervon-C Tablet", cat_supplement, brands["Enervon"], unit_tab, "8.00", "30 tablets", "500mg", "Tablet"),
            ("Clusivol Multivitamins", cat_supplement, brands["Clusivol"], unit_cap, "12.00", "30 capsules", None, "Capsule"),
            ("Centrum Advance", cat_supplement, brands["Centrum"], unit_tab, "22.00", "30 tablets", None, "Tablet"),
            ("Myra-E 400 IU", cat_supplement, brands["Myra-E"], unit_cap, "10.00", "30 capsules", "400 IU", "Capsule"),
            ("Vitamin C 500mg (Ascorbic Acid)", cat_supplement, brands["TGP Generics"], unit_tab, "4.00", "100 tablets", "500mg", "Tablet"),
            # Personal Care & Medical Supplies
            ("Betadine Solution 60mL", cat_personal, brands["Betadine"], unit_bot, "95.00", "60mL", None, None),
            ("Betadine Gargle 120mL", cat_personal, brands["Betadine"], unit_bot, "145.00", "120mL", None, None),
            ("Bactidol Gargle 250mL", cat_personal, brands["Bactidol"], unit_bot, "195.00", "250mL", None, None),
            ("Efficascent Oil 100mL", cat_personal, brands["Efficascent"], unit_bot, "85.00", "100mL", None, None),
            ("Isopropyl Alcohol 70% 500mL", cat_personal, brands["TGP Generics"], unit_bot, "45.00", "500mL", None, None),
            ("Face Mask Surgical (50pcs)", cat_medical, brands["TGP Generics"], unit_box, "150.00", "50 pcs", None, None),
            ("Hydrogen Peroxide 120mL", cat_medical, brands["TGP Generics"], unit_bot, "35.00", "120mL", None, None),
        ]

        products = []
        for name, cat, brand, unit, price, net, dos_str, dos_form in products_data:
            product, _ = Product.objects.get_or_create(
                product_name=name,
                defaults={
                    "category": cat, "brand": brand, "unit": unit,
                    "current_price": Decimal(price), "net_content": net,
                }
            )
            products.append(product)

            if dos_str:
                Drug.objects.get_or_create(
                    product=product,
                    defaults={"dosage_strength": dos_str, "dosage_form": dos_form}
                )

        # ══════════════════════════════════════════════════════════
        # STOCK ITEMS — inventory at each location
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📦 Creating stock items...")

        random.seed(42)  # Repeatable randomness
        stock_items_main = []
        stock_items_all = []

        for i, product in enumerate(products):
            # Main Branch: 30–300 units
            qty_main = random.randint(30, 300)
            # Some items deliberately low stock (below 20)
            if i in [3, 7, 12, 16, 28, 35]:
                qty_main = random.randint(2, 8)

            si_main, _ = StockItem.objects.get_or_create(
                product=product, location=loc_main,
                defaults={"quantity": qty_main}
            )
            stock_items_main.append(si_main)
            stock_items_all.append(si_main)

            # Branch 2: 15–120 units
            qty_b2 = random.randint(15, 120)
            if i in [5, 10, 20, 30]:
                qty_b2 = random.randint(1, 6)
            si_b2, _ = StockItem.objects.get_or_create(
                product=product, location=loc_branch2,
                defaults={"quantity": qty_b2}
            )
            stock_items_all.append(si_b2)

            # Warehouse: higher stock
            qty_wh = random.randint(100, 500)
            si_wh, _ = StockItem.objects.get_or_create(
                product=product, location=loc_warehouse,
                defaults={"quantity": qty_wh}
            )
            stock_items_all.append(si_wh)

        # ══════════════════════════════════════════════════════════
        # EXPIRATIONS — includes this month for dashboard visibility
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📅 Creating expiration dates...")

        for si in stock_items_all:
            qty = max(si.quantity // 3, 1)

            # Normal: 6-18 months out
            Expiration.objects.get_or_create(
                stock_item=si,
                expiry_date=today + timedelta(days=random.randint(180, 540)),
                defaults={"quantity": qty}
            )

        # Expiring THIS MONTH (so dashboard shows them)
        for i, si in enumerate(stock_items_main):
            if i % 3 == 0:  # Every 3rd product
                remaining_days = (today.replace(month=today.month % 12 + 1, day=1) - today).days if today.month < 12 else (today.replace(year=today.year + 1, month=1, day=1) - today).days
                exp_date = today + timedelta(days=random.randint(0, max(remaining_days - 1, 1)))
                Expiration.objects.get_or_create(
                    stock_item=si,
                    expiry_date=exp_date,
                    defaults={"quantity": random.randint(5, 25)}
                )

        # Some already expired (recent)
        for i in [1, 4, 9, 15, 22]:
            if i < len(stock_items_main):
                Expiration.objects.get_or_create(
                    stock_item=stock_items_main[i],
                    expiry_date=today - timedelta(days=random.randint(1, 30)),
                    defaults={"quantity": random.randint(2, 10)}
                )

        # ══════════════════════════════════════════════════════════
        # SUPPLIER ITEMS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🔗 Linking supplier items...")

        supplier_items = []
        for i, product in enumerate(products):
            supplier = suppliers[i % len(suppliers)]
            sp = (product.current_price * Decimal("0.65")).quantize(Decimal("0.01"))
            si, _ = SupplierItem.objects.get_or_create(
                supplier=supplier, product=product,
                defaults={"supplier_price": sp}
            )
            supplier_items.append(si)
            # Some products have multiple suppliers
            if i % 4 == 0 and len(suppliers) > 1:
                alt_supplier = suppliers[(i + 2) % len(suppliers)]
                sp2 = (product.current_price * Decimal("0.70")).quantize(Decimal("0.01"))
                SupplierItem.objects.get_or_create(
                    supplier=alt_supplier, product=product,
                    defaults={"supplier_price": sp2}
                )

        # ══════════════════════════════════════════════════════════
        # PRICE HISTORY
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📈 Creating price history...")

        for i, product in enumerate(products):
            if i % 3 == 0:
                old_price = (product.current_price * Decimal("0.85")).quantize(Decimal("0.01"))
                PriceHistory.objects.get_or_create(
                    product=product,
                    old_price=old_price,
                    new_price=product.current_price,
                )

        # ══════════════════════════════════════════════════════════
        # PURCHASE ORDERS (6 orders over the last 2 months)
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📋 Creating purchase orders...")

        po_configs = [
            ("PO-2026-001", 45, 35, po_received, [0, 1, 2, 7, 8]),
            ("PO-2026-002", 38, 28, po_received, [3, 4, 5, 11, 12]),
            ("PO-2026-003", 30, 20, po_received, [17, 18, 19, 20, 21]),
            ("PO-2026-004", 20, 10, po_received, [28, 29, 30, 31, 32]),
            ("PO-2026-005", 10, 3, po_approved, [6, 13, 14, 15, 25]),
            ("PO-2026-006", 3, None, po_pending, [22, 23, 24, 26, 27]),
        ]

        for po_id, days_ago, delivery_days_ago, status, prod_indices in po_configs:
            po, created = PurchaseOrder.objects.get_or_create(
                po_id=po_id,
                defaults={
                    "order_date": today - timedelta(days=days_ago),
                    "expected_delivery_date": today - timedelta(days=delivery_days_ago) if delivery_days_ago else today + timedelta(days=7),
                    "purchase_order_status": status,
                    "notes": f"Purchase order {po_id}",
                }
            )
            if created:
                for j, p_idx in enumerate(prod_indices):
                    if p_idx < len(products):
                        si_list = SupplierItem.objects.filter(product=products[p_idx])
                        if si_list.exists():
                            is_received = status in [po_received]
                            ordered = random.randint(50, 200)
                            PurchaseOrderItem.objects.create(
                                poi_id=f"POI-{po_id[-3:]}-{j + 1:02d}",
                                purchase_order=po,
                                supplier_item=si_list.first(),
                                ordered_qty=ordered,
                                received_qty=ordered if is_received else 0,
                                unit=products[p_idx].unit,
                                purchase_order_item_status=poi_received if is_received else poi_pending,
                            )

        # ══════════════════════════════════════════════════════════
        # STOCK TRANSFERS (4 transfers)
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🔄 Creating stock transfers...")

        st_configs = [
            ("ST-2026-001", 15, st_completed, loc_main, loc_branch2, [0, 1, 2, 7]),
            ("ST-2026-002", 10, st_completed, loc_warehouse, loc_main, [3, 4, 5, 11]),
            ("ST-2026-003", 5, st_completed, loc_warehouse, loc_branch2, [17, 18, 28]),
            ("ST-2026-004", 1, st_pending, loc_main, loc_branch2, [20, 21, 22]),
        ]

        for st_id, days_ago, status, src, dst, prod_indices in st_configs:
            st, created = StockTransfer.objects.get_or_create(
                transfer_id=st_id,
                defaults={
                    "transfer_date": today - timedelta(days=days_ago),
                    "stock_transfer_status": status,
                    "src_location": src,
                    "des_location": dst,
                }
            )
            if created:
                for j, p_idx in enumerate(prod_indices):
                    if p_idx < len(products):
                        is_done = status == st_completed
                        qty = random.randint(15, 50)
                        StockTransferItem.objects.create(
                            sti_id=f"STI-{st_id[-3:]}-{j + 1:02d}",
                            stock_transfer=st,
                            product=products[p_idx],
                            ordered_quantity=qty,
                            transferred_qty=qty if is_done else 0,
                            unit=products[p_idx].unit,
                            stock_transfer_item_status=sti_transferred if is_done else sti_pending,
                        )

        # ══════════════════════════════════════════════════════════
        # PRESCRIPTIONS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📝 Creating prescriptions...")

        prescriptions = []
        for i in range(8):
            customer = customers[i % len(customers)]
            physician = physicians[i % len(physicians)]
            presc, _ = Prescription.objects.get_or_create(
                customer=customer,
                physician=physician,
                prescription_details=f"Rx for {customer.person.first_name}: Take as prescribed",
                date_issued=today - timedelta(days=i * 3),
            )
            prescriptions.append(presc)

        # ══════════════════════════════════════════════════════════
        # POS TRANSACTIONS (20 sales over last 30 days)
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🛒 Creating POS transactions...")

        pos_records = []
        for idx in range(20):
            days_ago = idx * 1.5  # Spread over ~30 days
            sale_time = now - timedelta(days=days_ago, hours=random.randint(8, 17))

            order_types = ["Walk-in", "Walk-in", "Walk-in", "Prescription", "DSWD"]
            order_type = order_types[idx % len(order_types)]

            presc = prescriptions[idx % len(prescriptions)] if order_type == "Prescription" else None

            pos, created = POS.objects.get_or_create(
                invoice=f"INV-2026-{idx + 1:05d}",
                defaults={
                    "sale_date": sale_time,
                    "user": cashier_user if idx % 2 == 0 else users[4],  # Alternate cashiers
                    "order_type": order_type,
                    "prescription": presc,
                }
            )
            pos_records.append(pos)

            if created:
                # 1–4 items per transaction
                num_items = random.randint(1, 4)
                used_products = set()
                for j in range(num_items):
                    p_idx = (idx * 3 + j * 7) % len(products)
                    while p_idx in used_products:
                        p_idx = (p_idx + 1) % len(products)
                    used_products.add(p_idx)

                    qty = random.randint(1, 5)
                    POSItem.objects.create(
                        pos=pos,
                        product=products[p_idx],
                        price=products[p_idx].current_price,
                        quantity_sold=qty,
                    )

                # DSWD orders
                if order_type == "DSWD" and customers:
                    DswdOrder.objects.get_or_create(
                        pos=pos,
                        defaults={
                            "customer": customers[idx % len(customers)],
                            "gl_num": f"GL-2026-{idx + 1:04d}",
                            "gl_date": today - timedelta(days=int(days_ago)),
                            "claim_date": today - timedelta(days=int(days_ago) - 1) if days_ago > 1 else today,
                            "client_name": str(customers[idx % len(customers)].person),
                        }
                    )

        # ══════════════════════════════════════════════════════════
        # STOCK TRANSACTIONS (audit log for POS sales)
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📊 Creating stock transactions...")

        for pos in pos_records:
            pos_items = POSItem.objects.filter(pos=pos)
            for pi in pos_items:
                # Find stock item at main branch
                try:
                    stock_item = StockItem.objects.get(
                        product=pi.product, location=loc_main
                    )
                except StockItem.DoesNotExist:
                    continue

                StockTransaction.objects.get_or_create(
                    stock_item=stock_item,
                    transaction_type="POS",
                    reference_id=pos.pos_id,
                    defaults={
                        "transaction_date": pos.sale_date,
                        "quantity_change": -pi.quantity_sold,
                        "src_location": loc_main.location_id,
                    }
                )

        # Transfer transactions
        for st_cfg in st_configs:
            st_id = st_cfg[0]
            try:
                st_obj = StockTransfer.objects.get(transfer_id=st_id)
            except StockTransfer.DoesNotExist:
                continue
            for sti in StockTransferItem.objects.filter(stock_transfer=st_obj):
                try:
                    stock_item = StockItem.objects.get(
                        product=sti.product, location=st_obj.src_location
                    )
                except StockItem.DoesNotExist:
                    continue
                StockTransaction.objects.get_or_create(
                    stock_item=stock_item,
                    transaction_type="Transfer",
                    reference_id=st_obj.stock_transfer_id,
                    defaults={
                        "transaction_date": timezone.make_aware(
                            datetime.combine(st_obj.transfer_date, datetime.min.time())
                        ) if st_obj.transfer_date else now,
                        "quantity_change": -sti.transferred_qty,
                        "src_location": st_obj.src_location_id,
                        "des_location": st_obj.des_location_id,
                    }
                )

        # ══════════════════════════════════════════════════════════
        # DISPOSED ITEMS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🗑️  Creating disposed items...")

        for i in [2, 9, 15, 22, 33]:
            if i < len(stock_items_main):
                DisposedItem.objects.get_or_create(
                    stock_item=stock_items_main[i],
                    disposal_date=today - timedelta(days=random.randint(5, 30)),
                    defaults={
                        "quantity": random.randint(3, 12),
                        "reason": random.choice([
                            "Expired product",
                            "Damaged packaging",
                            "Quality control failure",
                            "Water damage",
                        ]),
                    }
                )

        # ══════════════════════════════════════════════════════════
        # INVENTORY AUDITS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  📝 Creating inventory audits...")

        for i, si in enumerate(stock_items_main[:15]):
            Inventory.objects.get_or_create(
                stock_item=si,
                audit_date=today - timedelta(days=random.randint(1, 14)),
                defaults={"counted_quantity": si.quantity + random.randint(-3, 3)}
            )

        # ══════════════════════════════════════════════════════════
        # RECEIPTS
        # ══════════════════════════════════════════════════════════
        self.stdout.write("  🧾 Creating receipts...")

        for idx, pos in enumerate(pos_records):
            total = sum(
                float(pi.price) * pi.quantity_sold
                for pi in POSItem.objects.filter(pos=pos)
            )
            Receipt.objects.get_or_create(
                receipt_number=f"RCP-2026-{idx + 1:05d}",
                defaults={
                    "receipt_date": pos.sale_date.date() if pos.sale_date else today,
                    "amount": Decimal(str(total)).quantize(Decimal("0.01")),
                }
            )

        # ══════════════════════════════════════════════════════════
        # DONE
        # ══════════════════════════════════════════════════════════
        self.stdout.write("")
        self.stdout.write("  ══════════════════════════════════════")
        self.stdout.write("  📌 Demo Credentials:")
        self.stdout.write("     Username: demo     Password: demo123     (Admin)")
        self.stdout.write("     Username: maria    Password: maria123    (Cashier)")
        self.stdout.write("     Username: juan     Password: juan123     (Pharmacist)")
        self.stdout.write("  ══════════════════════════════════════")
        self.stdout.write("")
        self.stdout.write(f"  📊 Summary:")
        self.stdout.write(f"     {Product.objects.count()} products")
        self.stdout.write(f"     {StockItem.objects.count()} stock items across {Location.objects.count()} locations")
        self.stdout.write(f"     {Expiration.objects.count()} expiration records")
        self.stdout.write(f"     {Supplier.objects.count()} suppliers with {SupplierItem.objects.count()} supplier items")
        self.stdout.write(f"     {PurchaseOrder.objects.count()} purchase orders")
        self.stdout.write(f"     {StockTransfer.objects.count()} stock transfers")
        self.stdout.write(f"     {POS.objects.count()} POS transactions with {POSItem.objects.count()} line items")
        self.stdout.write(f"     {StockTransaction.objects.count()} stock transaction logs")
        self.stdout.write(f"     {Prescription.objects.count()} prescriptions")
        self.stdout.write(f"     {Receipt.objects.count()} receipts")
        self.stdout.write(f"     {Customer.objects.count()} customers")
        self.stdout.write(f"     {User.objects.count()} users")
