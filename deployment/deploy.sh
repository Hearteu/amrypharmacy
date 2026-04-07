#!/bin/bash
# =============================================================
# Amry Pharmacy — Full Deployment Script for Oracle Cloud
# =============================================================
# Run this script on your Oracle Cloud instance (ubuntu user)
# Usage: bash deploy.sh
# =============================================================

set -e  # Exit on any error

APP_DIR="/home/ubuntu/amrypharmacy"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/pharmacy"

echo "=========================================="
echo "  Amry Pharmacy — Deployment Script"
echo "=========================================="

# -----------------------------------------------------------
# Step 1: System Dependencies
# -----------------------------------------------------------
echo ""
echo "[1/8] Installing system dependencies..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib python3 python3-venv python3-pip nginx

# Install Node 20 LTS via NodeSource (if not already installed)
NODE_VERSION=$(node -v 2>/dev/null || echo "none")
echo "  Current Node version: $NODE_VERSION"
if [[ "$NODE_VERSION" == "none" || "$NODE_VERSION" < "v20" ]]; then
    echo "  Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# -----------------------------------------------------------
# Step 2: PostgreSQL Setup
# -----------------------------------------------------------
echo ""
echo "[2/8] Setting up PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database user and database (idempotent)
if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='pharmacy_user'" | grep -q 1; then
    read -sp "Enter password for PostgreSQL user 'pharmacy_user': " DB_PASS
    echo
    sudo -u postgres psql -c "CREATE USER pharmacy_user WITH PASSWORD '$DB_PASS';"
fi

sudo -u postgres psql -tc "SELECT 1 FROM pg_catalog.pg_database WHERE datname='amrypharmacy'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE amrypharmacy OWNER pharmacy_user;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE amrypharmacy TO pharmacy_user;"

echo "  ✅ PostgreSQL ready"

# -----------------------------------------------------------
# Step 3: Create log directory
# -----------------------------------------------------------
echo ""
echo "[3/8] Creating log directory..."
sudo mkdir -p $LOG_DIR
sudo chown ubuntu:www-data $LOG_DIR
echo "  ✅ Log directory ready: $LOG_DIR"

# -----------------------------------------------------------
# Step 4: Clone / Pull latest code
# -----------------------------------------------------------
echo ""
echo "[4/8] Pulling latest code..."
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git pull origin oracle
else
    echo "  ⚠️  Repository not cloned yet."
    echo "  Please clone your repo to $APP_DIR first:"
    echo "  git clone <your-repo-url> $APP_DIR"
    exit 1
fi

# -----------------------------------------------------------
# Step 5: Backend Setup (Django + Gunicorn)
# -----------------------------------------------------------
echo ""
echo "[5/8] Setting up Django backend..."
cd $BACKEND_DIR

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Create production .env if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
DB_NAME=amrypharmacy
DB_USER=pharmacy_user
DB_PASSWORD=CHANGE_ME
DB_HOST=127.0.0.1
DB_PORT=5432
DJANGO_SECRET_KEY=CHANGE_THIS_TO_A_REAL_SECRET_KEY
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,hearteu02.com
ENVEOF
    echo "  ⚠️  Created .env — PLEASE UPDATE DJANGO_SECRET_KEY!"
fi

# Run migrations and collect static files
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput

deactivate
echo "  ✅ Backend ready"

# -----------------------------------------------------------
# Step 6: Frontend Setup (Next.js)
# -----------------------------------------------------------
echo ""
echo "[6/8] Setting up Next.js frontend..."
cd $FRONTEND_DIR

# Create production .env if it doesn't exist
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'ENVEOF'
NEXT_PUBLIC_API_URL=https://hearteu02.com/pharmacy/api
NEXT_PUBLIC_BASE_PATH=/pharmacy
NEXTAUTH_URL=https://hearteu02.com/pharmacy
NEXTAUTH_SECRET=CHANGE_THIS_TO_A_REAL_SECRET
ENVEOF
    echo "  ⚠️  Created .env.production — PLEASE UPDATE NEXTAUTH_SECRET!"
fi

# Install dependencies and build
npm install
npm run build

# Copy static files for standalone mode
if [ -d ".next/standalone" ]; then
    cp -r .next/static .next/standalone/.next/static
    cp -r public .next/standalone/public 2>/dev/null || true
fi

echo "  ✅ Frontend ready"

# -----------------------------------------------------------
# Step 7: Install systemd services
# -----------------------------------------------------------
echo ""
echo "[7/8] Installing systemd services..."
DEPLOY_DIR="$APP_DIR/deployment"

sudo cp $DEPLOY_DIR/pharmacy-backend.service /etc/systemd/system/
sudo cp $DEPLOY_DIR/pharmacy-frontend.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable pharmacy-backend
sudo systemctl enable pharmacy-frontend
sudo systemctl restart pharmacy-backend
sudo systemctl restart pharmacy-frontend

echo "  ✅ Services installed and started"

# -----------------------------------------------------------
# Step 8: Nginx Configuration
# -----------------------------------------------------------
echo ""
echo "[8/8] Configuring Nginx..."

# We no longer aggressively copy this file because it creates duplicate global includes.
# Nginx is already configured manually on the server.
# sudo mkdir -p /etc/nginx/snippets
# sudo cp $DEPLOY_DIR/nginx-pharmacy.conf /etc/nginx/snippets/pharmacy.conf

echo "  ⚠️  Nginx configuration copied to /etc/nginx/snippets/pharmacy.conf"
echo "  ⚠️  Since you already have a website on hearteu02.com, you must manually add this"
echo "  ⚠️  to your existing Nginx server block for hearteu02.com."
echo ""
echo "  Run this command to edit your existing config (e.g., /etc/nginx/sites-available/...):"
echo "      sudo nano /etc/nginx/sites-available/default"
echo "  And add this single line inside your 'server { ... }' block:"
echo "      include /etc/nginx/snippets/pharmacy.conf;"
echo ""
echo "  Then reload Nginx:"
echo "      sudo systemctl reload nginx"

# -----------------------------------------------------------
# Done!
# -----------------------------------------------------------
echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "  Backend:  http://127.0.0.1:8001 (Gunicorn)"
echo "  Frontend: http://127.0.0.1:3001 (Next.js)"
echo "  Public:   https://hearteu02.com/pharmacy"
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status pharmacy-backend"
echo "    sudo systemctl status pharmacy-frontend"
echo "    sudo journalctl -u pharmacy-backend -f"
echo "    sudo journalctl -u pharmacy-frontend -f"
echo "    tail -f $LOG_DIR/backend-access.log"
echo ""
echo "  ⚠️  Don't forget to:"
echo "    1. Update DJANGO_SECRET_KEY in $BACKEND_DIR/.env"
echo "    2. Update NEXTAUTH_SECRET in $FRONTEND_DIR/.env.production"
echo "    3. Run Phase 6: Data Migration (Supabase → PostgreSQL)"
echo "=========================================="
