"""
Seed command — populates the database with demo data.

Usage:
    python manage.py seed          # Seed everything
    python manage.py seed --reset  # Wipe all tables first, then seed
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from pharmacy.models import (
    Brand,
    Branch,
    Customer,
    CustomerType,
    Drug,
    Expiration,
    Location,
    Person,
    Physician,
    POS,
    POSItem,
    Product,
    ProductCategory,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderItemStatus,
    PurchaseOrderStatus,
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
    help = "Seed the database with demo data"

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
            POSItem, POS, StockTransaction, Expiration,
            PurchaseOrderItem, PurchaseOrder,
            StockTransferItem, StockTransfer,
            SupplierItem, StockItem, Drug, Product,
            Supplier, Physician, Customer,
            User, Person,
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

        # ── Lookup tables ────────────────────────────────────────
        status_active, _ = Status.objects.get_or_create(status="Active")
        status_inactive, _ = Status.objects.get_or_create(status="Inactive")

        role_admin, _ = UserRole.objects.get_or_create(role_name="Admin")
        role_pharmacist, _ = UserRole.objects.get_or_create(role_name="Pharmacist")
        role_cashier, _ = UserRole.objects.get_or_create(role_name="Cashier")
        role_staff, _ = UserRole.objects.get_or_create(role_name="Staff")

        loc_main, _ = Location.objects.get_or_create(location="Main Branch")
        loc_branch2, _ = Location.objects.get_or_create(location="Branch 2")
        loc_warehouse, _ = Location.objects.get_or_create(location="Warehouse")

        branch_main, _ = Branch.objects.get_or_create(branch_name="Main Branch")
        branch_2, _ = Branch.objects.get_or_create(branch_name="Branch 2")

        unit_pc, _ = Unit.objects.get_or_create(unit="Piece")
        unit_box, _ = Unit.objects.get_or_create(unit="Box")
        unit_bot, _ = Unit.objects.get_or_create(unit="Bottle")
        unit_tab, _ = Unit.objects.get_or_create(unit="Tablet")
        unit_cap, _ = Unit.objects.get_or_create(unit="Capsule")

        brand_biogesic, _ = Brand.objects.get_or_create(brand_name="Biogesic")
        brand_neozep, _ = Brand.objects.get_or_create(brand_name="Neozep")
        brand_alaxan, _ = Brand.objects.get_or_create(brand_name="Alaxan")
        brand_medicol, _ = Brand.objects.get_or_create(brand_name="Medicol")
        brand_bioflu, _ = Brand.objects.get_or_create(brand_name="Bioflu")
        brand_solmux, _ = Brand.objects.get_or_create(brand_name="Solmux")
        brand_decolgen, _ = Brand.objects.get_or_create(brand_name="Decolgen")
        brand_diatabs, _ = Brand.objects.get_or_create(brand_name="Diatabs")
        brand_mefenamic, _ = Brand.objects.get_or_create(brand_name="Ponstan")
        brand_amoxicillin, _ = Brand.objects.get_or_create(brand_name="Amoxicillin")

        cat_otc, _ = ProductCategory.objects.get_or_create(category_name="Over-the-Counter")
        cat_rx, _ = ProductCategory.objects.get_or_create(category_name="Prescription Drug")
        cat_supplement, _ = ProductCategory.objects.get_or_create(category_name="Supplement")
        cat_personal, _ = ProductCategory.objects.get_or_create(category_name="Personal Care")

        ct_regular, _ = CustomerType.objects.get_or_create(
            description="Regular", defaults={"discount": Decimal("0.00")}
        )
        ct_senior, _ = CustomerType.objects.get_or_create(
            description="Senior Citizen", defaults={"discount": Decimal("20.00")}
        )
        ct_pwd, _ = CustomerType.objects.get_or_create(
            description="PWD", defaults={"discount": Decimal("20.00")}
        )

        # ── Purchase Order / Stock Transfer Statuses ─────────────
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

        # ── Demo Users ───────────────────────────────────────────
        self.stdout.write("  👤 Creating users...")

        demo_person, _ = Person.objects.get_or_create(
            first_name="Demo", last_name="User",
            defaults={"contact": "09171234567", "email": "demo@amrypharmacy.com"}
        )
        demo_user, _ = User.objects.get_or_create(
            username="demo",
            defaults={
                "person": demo_person,
                "role": role_admin,
                "location": loc_main,
                "password": make_password("demo123"),
                "status": "Active",
            }
        )

        admin_person, _ = Person.objects.get_or_create(
            first_name="Admin", last_name="User",
            defaults={"contact": "09181234567", "email": "admin@amrypharmacy.com"}
        )
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "person": admin_person,
                "role": role_admin,
                "location": loc_main,
                "password": make_password("admin123"),
                "status": "Active",
            }
        )

        cashier_person, _ = Person.objects.get_or_create(
            first_name="Maria", last_name="Santos",
            defaults={"contact": "09191234567", "email": "maria@amrypharmacy.com"}
        )
        cashier_user, _ = User.objects.get_or_create(
            username="maria",
            defaults={
                "person": cashier_person,
                "role": role_cashier,
                "location": loc_main,
                "password": make_password("maria123"),
                "status": "Active",
            }
        )

        pharmacist_person, _ = Person.objects.get_or_create(
            first_name="Juan", last_name="Dela Cruz",
            defaults={"contact": "09201234567", "email": "juan@amrypharmacy.com"}
        )
        pharmacist_user, _ = User.objects.get_or_create(
            username="juan",
            defaults={
                "person": pharmacist_person,
                "role": role_pharmacist,
                "location": loc_main,
                "password": make_password("juan123"),
                "status": "Active",
            }
        )

        # ── Suppliers ────────────────────────────────────────────
        self.stdout.write("  🏭 Creating suppliers...")

        sup_persons = []
        suppliers_data = [
            ("Mercury Drug Corp", "Ana", "Reyes", "09211111111", "ana@mercurydrug.com", "VAT-001-MERCURY"),
            ("Unilab Inc.", "Pedro", "Garcia", "09222222222", "pedro@unilab.com", "VAT-002-UNILAB"),
            ("Generics Pharmacy", "Rosa", "Mendoza", "09233333333", "rosa@generics.com", "VAT-003-GENERICS"),
            ("Pascual Labs", "Carlos", "Tan", "09244444444", "carlos@pascual.com", "VAT-004-PASCUAL"),
        ]

        suppliers = []
        for sname, fname, lname, contact, email, vat in suppliers_data:
            person, _ = Person.objects.get_or_create(
                first_name=fname, last_name=lname,
                defaults={"contact": contact, "email": email}
            )
            supplier, _ = Supplier.objects.get_or_create(
                supplier_name=sname,
                defaults={"person": person, "vat_num": vat, "status": status_active}
            )
            suppliers.append(supplier)

        # ── Physicians ───────────────────────────────────────────
        self.stdout.write("  🩺 Creating physicians...")

        physicians_data = [
            ("Dr. Jose", "Rizal", "PRC-12345", "PTR-54321"),
            ("Dr. Maria", "Clara", "PRC-67890", "PTR-09876"),
        ]
        for fname, lname, prc, ptr in physicians_data:
            person, _ = Person.objects.get_or_create(
                first_name=fname, last_name=lname
            )
            Physician.objects.get_or_create(
                person=person, defaults={"prc_num": prc, "ptr_num": ptr}
            )

        # ── Customers ────────────────────────────────────────────
        self.stdout.write("  🧑 Creating customers...")

        customers_data = [
            ("Roberto", "Cruz", ct_regular, None),
            ("Lourdes", "Bautista", ct_senior, "SC-2026-001"),
            ("Ricardo", "Ramos", ct_pwd, "PWD-2026-001"),
        ]
        for fname, lname, ctype, card in customers_data:
            person, _ = Person.objects.get_or_create(
                first_name=fname, last_name=lname
            )
            Customer.objects.get_or_create(
                person=person,
                defaults={"customer_type": ctype, "id_card_number": card}
            )

        # ── Products ─────────────────────────────────────────────
        self.stdout.write("  💊 Creating products...")

        products_data = [
            # (name, category, brand, unit, price, net_content, dosage_strength, dosage_form)
            ("Biogesic 500mg", cat_otc, brand_biogesic, unit_tab, "7.50", "500mg", "500mg", "Tablet"),
            ("Neozep Forte", cat_otc, brand_neozep, unit_cap, "9.00", "10 capsules", "500mg/2mg/25mg", "Capsule"),
            ("Alaxan FR", cat_otc, brand_alaxan, unit_cap, "10.00", "10 capsules", "200mg/325mg", "Capsule"),
            ("Medicol Advance 400mg", cat_otc, brand_medicol, unit_cap, "11.50", "10 capsules", "400mg", "Capsule"),
            ("Bioflu", cat_otc, brand_bioflu, unit_tab, "12.00", "10 tablets", "500mg/2mg/25mg", "Tablet"),
            ("Solmux 500mg", cat_otc, brand_solmux, unit_cap, "14.00", "10 capsules", "500mg", "Capsule"),
            ("Decolgen Forte", cat_otc, brand_decolgen, unit_tab, "8.50", "10 tablets", "500mg/2mg/25mg", "Tablet"),
            ("Diatabs", cat_otc, brand_diatabs, unit_tab, "6.00", "4 tablets", "2mg", "Tablet"),
            ("Mefenamic Acid 500mg", cat_rx, brand_mefenamic, unit_cap, "8.00", "10 capsules", "500mg", "Capsule"),
            ("Amoxicillin 500mg", cat_rx, brand_amoxicillin, unit_cap, "12.50", "10 capsules", "500mg", "Capsule"),
            ("Cetirizine 10mg", cat_otc, brand_biogesic, unit_tab, "5.00", "10 tablets", "10mg", "Tablet"),
            ("Loperamide 2mg", cat_otc, brand_diatabs, unit_cap, "5.50", "4 capsules", "2mg", "Capsule"),
            ("Vitamin C 500mg", cat_supplement, brand_biogesic, unit_tab, "4.00", "100 tablets", "500mg", "Tablet"),
            ("Multivitamins", cat_supplement, brand_biogesic, unit_tab, "8.00", "30 tablets", None, "Tablet"),
            ("Isopropyl Alcohol 70%", cat_personal, brand_biogesic, unit_bot, "45.00", "500ml", None, None),
            ("Face Mask (Surgical)", cat_personal, brand_biogesic, unit_box, "150.00", "50 pcs", None, None),
            ("Hydrogen Peroxide", cat_personal, brand_biogesic, unit_bot, "35.00", "120ml", None, None),
            ("Omeprazole 20mg", cat_rx, brand_amoxicillin, unit_cap, "7.00", "10 capsules", "20mg", "Capsule"),
            ("Losartan 50mg", cat_rx, brand_amoxicillin, unit_tab, "9.00", "30 tablets", "50mg", "Tablet"),
            ("Metformin 500mg", cat_rx, brand_amoxicillin, unit_tab, "6.50", "30 tablets", "500mg", "Tablet"),
        ]

        products = []
        for name, cat, brand, unit, price, net, dos_str, dos_form in products_data:
            product, _ = Product.objects.get_or_create(
                product_name=name,
                defaults={
                    "category": cat,
                    "brand": brand,
                    "unit": unit,
                    "current_price": Decimal(price),
                    "net_content": net,
                }
            )
            products.append(product)

            # Create Drug entry if it has dosage info
            if dos_str:
                Drug.objects.get_or_create(
                    product=product,
                    defaults={
                        "dosage_strength": dos_str,
                        "dosage_form": dos_form,
                    }
                )

        # ── Stock Items (inventory at each location) ─────────────
        self.stdout.write("  📦 Creating stock items...")

        stock_items = []
        for i, product in enumerate(products):
            # Main Branch stock
            qty_main = 50 + (i * 7) % 200
            si_main, _ = StockItem.objects.get_or_create(
                product=product, location=loc_main,
                defaults={"quantity": qty_main}
            )
            stock_items.append(si_main)

            # Branch 2 stock (lower quantities)
            qty_b2 = 20 + (i * 5) % 80
            si_b2, _ = StockItem.objects.get_or_create(
                product=product, location=loc_branch2,
                defaults={"quantity": qty_b2}
            )

            # Some items have low stock to test alerts
            if i in [3, 7, 12]:
                si_main.quantity = 5
                si_main.save()

        # ── Expirations ──────────────────────────────────────────
        self.stdout.write("  📅 Creating expiration dates...")

        for si in stock_items:
            # Normal expiration (1-2 years out)
            Expiration.objects.get_or_create(
                stock_item=si,
                expiry_date=today + timedelta(days=365 + (si.pk * 17) % 365),
                defaults={"quantity": si.quantity // 2}
            )
            # Some items expiring soon (for alerts)
            if si.pk % 5 == 0:
                Expiration.objects.get_or_create(
                    stock_item=si,
                    expiry_date=today + timedelta(days=15),
                    defaults={"quantity": 10}
                )

        # ── Supplier Items (which supplier sells which product) ──
        self.stdout.write("  🔗 Linking supplier items...")

        for i, product in enumerate(products):
            supplier = suppliers[i % len(suppliers)]
            sp = Decimal(str(float(product.current_price) * 0.7))
            SupplierItem.objects.get_or_create(
                supplier=supplier, product=product,
                defaults={"supplier_price": sp.quantize(Decimal("0.01"))}
            )

        # ── Purchase Orders ──────────────────────────────────────
        self.stdout.write("  📋 Creating purchase orders...")

        for idx in range(3):
            po, created = PurchaseOrder.objects.get_or_create(
                po_id=f"PO-2026-{idx + 1:03d}",
                defaults={
                    "order_date": today - timedelta(days=30 - idx * 10),
                    "expected_delivery_date": today - timedelta(days=20 - idx * 10),
                    "purchase_order_status": po_received if idx < 2 else po_pending,
                    "notes": f"Demo purchase order #{idx + 1}",
                }
            )
            if created:
                for j in range(3):
                    p_idx = idx * 3 + j
                    if p_idx < len(products):
                        si_list = SupplierItem.objects.filter(product=products[p_idx])
                        if si_list.exists():
                            PurchaseOrderItem.objects.create(
                                poi_id=f"POI-{idx + 1:03d}-{j + 1:02d}",
                                purchase_order=po,
                                supplier_item=si_list.first(),
                                ordered_qty=100,
                                received_qty=100 if idx < 2 else 0,
                                unit=products[p_idx].unit,
                                purchase_order_item_status=poi_received if idx < 2 else poi_pending,
                            )

        # ── Stock Transfers ──────────────────────────────────────
        self.stdout.write("  🔄 Creating stock transfers...")

        st, created = StockTransfer.objects.get_or_create(
            transfer_id="ST-2026-001",
            defaults={
                "transfer_date": today - timedelta(days=5),
                "stock_transfer_status": st_completed,
                "src_location": loc_main,
                "des_location": loc_branch2,
            }
        )
        if created:
            for j in range(2):
                StockTransferItem.objects.create(
                    sti_id=f"STI-001-{j + 1:02d}",
                    stock_transfer=st,
                    product=products[j],
                    ordered_quantity=25,
                    transferred_qty=25,
                    unit=products[j].unit,
                    stock_transfer_item_status=sti_transferred,
                )

        # ── POS Transactions ─────────────────────────────────────
        self.stdout.write("  🛒 Creating POS transactions...")

        for idx in range(5):
            pos, created = POS.objects.get_or_create(
                invoice=f"INV-2026-{idx + 1:05d}",
                defaults={
                    "sale_date": today - timedelta(days=idx),
                    "user": cashier_user,
                    "order_type": "Walk-in",
                }
            )
            if created:
                for j in range(2):
                    p_idx = (idx * 2 + j) % len(products)
                    POSItem.objects.create(
                        pos=pos,
                        product=products[p_idx],
                        price=products[p_idx].current_price,
                        quantity_sold=1 + j,
                    )

        self.stdout.write("")
        self.stdout.write("  ──────────────────────────────────")
        self.stdout.write("  📌 Demo Credentials:")
        self.stdout.write("     Username: demo")
        self.stdout.write("     Password: demo123")
        self.stdout.write("     Role:     Admin")
        self.stdout.write("  ──────────────────────────────────")
