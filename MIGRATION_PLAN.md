# Amry Pharmacy — Migration Plan: Supabase → Local PostgreSQL + Django ORM

## Overview
This document outlines the full migration from Supabase API calls to Django ORM with a local PostgreSQL database, and deployment to the Oracle Cloud instance at `hearteu02.com/pharmacy/`.

---

## Phase 1: Create Django Models (`models.py`)

Based on analysis of all 38 view files, the database has the following tables and relationships:

### Core Tables (in dependency order)

```
1.  Person           — Base contact info (first_name, last_name, contact, email, address)
2.  Status           — Generic status lookup (status text)
3.  User_Role        — Role lookup (role_name)
4.  Location         — Branch/warehouse locations (location name)
5.  Unit             — Measurement units (unit text)
6.  Brand            — Product brands (brand_name)
7.  Product_Category — Product categories (category_name)
8.  Branch           — Business branches (branch fields)
9.  Customer_Type    — Customer type lookup (description)

10. Users            — FK → Person, User_Role, Location (username, password, status)
11. Customers        — FK → Person, Customer_Type (id_card_number)
12. Supplier         — FK → Person, Status (supplier_name, vat_num)
13. Physician        — FK → Person (prc_num, ptr_num)

14. Products         — FK → Brand, Product_Category, Unit (product_name, current_price, net_content)
15. Drugs            — FK → Products (dosage_strength, dosage_form) [1-to-1 extension]

16. Stock_Item       — FK → Products, Location (quantity)
17. Expiration       — FK → Stock_Item (expiry_date, quantity)

18. Supplier_Item    — FK → Supplier, Products (cost_price, etc.)
19. Price_History    — FK → Products (old_price, new_price, date)

20. Purchase_Order           — FK → Supplier, Location, Users (po_date, status fields)
21. Purchase_Order_Status    — Status lookup for POs
22. Purchase_Order_Item      — FK → Purchase_Order, Products (quantity, cost)
23. Purchase_Order_Item_Status — Status lookup for PO items

24. Stock_Transfer           — FK → Location (src), Location (dest), Users
25. Stock_Transfer_Status    — Status lookup for transfers
26. Stock_Transfer_Item      — FK → Stock_Transfer, Products (quantity)
27. Stock_Transfer_Item_Status — Status lookup for transfer items

28. Stock_Transaction        — FK → Stock_Item (transaction_date, type, quantity_change, reference_id, src/dest location)

29. POS              — FK → Users, Prescription (sale_date, invoice, order_type)
30. POS_Item         — FK → POS, Products (price, quantity_sold)
31. Prescription     — FK → Customers, Physician (prescription_details, date_issued)
32. Dswd_Order       — FK → Customers, POS (gl_num, gl_date, claim_date, client_name)

33. Receipt          — FK → POS or Purchase_Order (receipt details)
34. Disposed_Items   — Disposed/expired stock records
35. Inventory        — Inventory audit records
36. Statement_Of_Accounts — FK → Supplier (SOA records)
37. Order            — General order records
```

### What Needs to Be Created
- **~30 Django model classes** in `pharmacy/models.py`
- Each with proper `ForeignKey`, `OneToOneField`, `CharField`, `DecimalField`, `DateField`, etc.
- All primary keys should use `AutoField` to match Supabase's auto-increment behavior

---

## Phase 2: Rewrite All 38 View Files

Every view file currently does this pattern:
```python
# OLD (Supabase)
supabase.table("Products").select("*").eq("product_id", id).execute()
supabase.table("Products").insert({...}).execute()
supabase.table("Products").update({...}).eq("product_id", id).execute()
supabase.table("Products").delete().eq("product_id", id).execute()
```

Must be converted to:
```python
# NEW (Django ORM)
Product.objects.filter(product_id=id)
Product.objects.create(**data)
Product.objects.filter(product_id=id).update(**data)
Product.objects.filter(product_id=id).delete()
```

### View files to rewrite (38 total):
| # | File | Complexity | Notes |
|---|------|-----------|-------|
| 1 | branch.py | Simple | Basic CRUD |
| 2 | customer_type.py | Simple | Basic CRUD |
| 3 | customers.py | Simple | Basic CRUD |
| 4 | disposed_items.py | Simple | Basic CRUD |
| 5 | drugs.py | Medium | Joined queries with Products |
| 6 | dswd.py | Simple | Basic CRUD |
| 7 | expiration.py | Medium | FIFO logic, joins with Stock_Item |
| 8 | inventory.py | Simple | Basic CRUD |
| 9 | location.py | Simple | Basic CRUD |
| 10 | order.py | Simple | Basic CRUD |
| 11 | person_views.py | Simple | Basic CRUD |
| 12 | physician.py | Simple | Basic CRUD |
| 13 | **pos.py** | **Complex** | Multi-table insert, FIFO expiry, stock deduction |
| 14 | pos_item.py | Simple | Basic CRUD |
| 15 | prescription.py | Simple | Basic CRUD |
| 16 | price_history.py | Simple | Basic CRUD |
| 17 | product_brand.py | Simple | Basic CRUD |
| 18 | product_category.py | Simple | Basic CRUD |
| 19 | **products.py** | **Complex** | Nested joins (Brand, Category, Unit, Drugs, Stock_Item, Location, Expiration) |
| 20 | **purchase_order.py** | **Complex** | Multi-table transactions, status tracking |
| 21 | purchase_order_item.py | Medium | Joins with PO and Products |
| 22 | purchase_order_item_status.py | Simple | Status CRUD |
| 23 | purchase_order_status.py | Simple | Status CRUD |
| 24 | receipt.py | Medium | Joins with POS |
| 25 | statement_of_accounts.py | Medium | Joins with Supplier |
| 26 | status.py | Simple | Basic CRUD |
| 27 | stock_item.py | Medium | Joins with Products, Location |
| 28 | **stock_transaction.py** | **Complex** | Multi-table joins, transaction logging |
| 29 | **stock_transfer.py** | **Complex** | Multi-table transactions, location tracking |
| 30 | stock_transfer_item.py | Medium | Joins with Stock_Transfer |
| 31 | stock_transfer_item_status.py | Simple | Status CRUD |
| 32 | stock_transfer_status.py | Simple | Status CRUD |
| 33 | supplier.py | Medium | Joins with Person, Status |
| 34 | supplier_item.py | Medium | Joins with Supplier, Products |
| 35 | unit.py | Simple | Basic CRUD |
| 36 | user_role.py | Simple | Basic CRUD |
| 37 | **user_views.py** | **Complex** | Password hashing, JWT tokens, joins |
| 38 | __init__.py | N/A | Just imports |

---

## Phase 3: Update Django Settings

### settings.py changes:
1. Remove `SUPABASE_URL` and `SUPABASE_KEY` 
2. Update `DATABASES` to point to local PostgreSQL:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'amrypharmacy',
           'USER': 'pharmacy_user',
           'PASSWORD': '<secure_password>',
           'HOST': '127.0.0.1',
           'PORT': '5432',
       }
   }
   ```
3. Set `DEBUG = False` for production
4. Update `ALLOWED_HOSTS` to include `hearteu02.com`
5. Update `CORS_ALLOWED_ORIGINS` to include production URL
6. Add `STATIC_ROOT` for collectstatic
7. Add `CSRF_TRUSTED_ORIGINS`

---

## Phase 4: Frontend (Next.js) Changes

### API Base URL
The frontend needs to point to the production backend:
- Currently: `http://localhost:8000/api/`
- Production: `https://hearteu02.com/pharmacy/api/`

### next.config.mjs
Add `basePath` for subdirectory deployment:
```js
const nextConfig = {
    basePath: '/pharmacy',
    output: 'standalone',
};
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://hearteu02.com/pharmacy/api
NEXTAUTH_URL=https://hearteu02.com/pharmacy
NEXTAUTH_SECRET=<your_secret>
```

---

## Phase 5: Oracle Cloud Deployment

### Install PostgreSQL on Oracle:
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser --interactive  # Create pharmacy_user
sudo -u postgres createdb amrypharmacy     # Create database
```

### Deploy Backend (Django + Gunicorn):
```bash
# Clone repo, create venv, install deps
pip install gunicorn psycopg2-binary
python manage.py migrate
python manage.py collectstatic
```

### Deploy Frontend (Next.js):
```bash
npm install && npm run build
# Run with PM2 or systemd on port 3001
```

### Nginx Configuration:
```nginx
# In the hearteu02.com server block:

# Next.js Frontend
location /pharmacy {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}

# Django API Backend
location /pharmacy/api/ {
    proxy_pass http://127.0.0.1:8001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Systemd Services:
- `pharmacy-backend.service` — Gunicorn running Django on port 8001
- `pharmacy-frontend.service` — Next.js running on port 3001

---

## Phase 6: Data Migration (Supabase → Local PostgreSQL)

### Option A: Export from Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Run `COPY` commands to export each table as CSV
3. Import CSVs into local PostgreSQL using `\copy`

### Option B: Direct Database Connection
Since Supabase is just PostgreSQL, you can use `pg_dump`:
```bash
pg_dump "postgresql://postgres.lobcigyihkgseoiorlop:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" > supabase_backup.sql
psql -U pharmacy_user -d amrypharmacy < supabase_backup.sql
```

---

## Estimated Work Breakdown

| Phase | Task | Effort |
|-------|------|--------|
| 1 | Create Django models | ~2 hours |
| 2 | Rewrite simple views (22 files) | ~3 hours |
| 2 | Rewrite complex views (6 files) | ~4 hours |
| 3 | Update settings.py | ~30 min |
| 4 | Update Next.js config | ~1 hour |
| 5 | Oracle deployment setup | ~2 hours |
| 6 | Data migration | ~1 hour |
| **Total** | | **~13 hours** |

---

## Order of Execution
1. ✅ Create all Django models (33 model classes in `pharmacy/models.py`)
2. ⬜ Run `makemigrations` and `migrate`
3. ✅ Rewrite all 37 view files (simple ones first, complex ones last)
4. ✅ Update `settings.py` (removed Supabase, added local PostgreSQL, CORS, CSRF, timezone)
5. ✅ Update frontend config (centralized API_URL, basePath, .env.production)
6. ✅ Deployment config created (systemd services, Nginx config, deploy.sh)
7. ⬜ Deploy to Oracle Cloud & run deploy.sh
8. ⬜ Migrate data from Supabase (Phase 6)
9. ⬜ Test everything end-to-end

### Current Status: Phase 5 Complete ✅
**Next up: Phase 6 — Data Migration (Supabase → Local PostgreSQL)**
