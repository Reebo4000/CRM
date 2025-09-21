#!/bin/bash

# Production Setup Script for CRM System
# This script sets up the production environment

set -e  # Exit on any error

echo "🚀 Setting up CRM System for Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check required tools
print_status "Checking required tools..."
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed. Aborting."; exit 1; }

print_success "All required tools are installed"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p backups
mkdir -p ssl
mkdir -p backend/uploads
mkdir -p backend/logs
mkdir -p frontend/dist

print_success "Directories created"

# Set up environment files
print_status "Setting up environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.production backend/.env
    print_warning "Backend .env file created from template. Please update with your production values!"
else
    print_warning "Backend .env file already exists. Please verify it contains production values."
fi

if [ ! -f frontend/.env.production ]; then
    cp frontend/.env.production frontend/.env.production
    print_warning "Frontend .env.production file already exists. Please verify it contains production values."
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --only=production
cd ..

print_success "Backend dependencies installed"

# Build frontend
print_status "Building frontend for production..."
cd frontend
npm ci
npm run build
cd ..

print_success "Frontend built successfully"

# Set up database
print_status "Setting up database..."
cd backend
npx sequelize-cli db:create --env production 2>/dev/null || print_warning "Database might already exist"
npx sequelize-cli db:migrate --env production
npx sequelize-cli db:seed:all --env production
cd ..

print_success "Database setup completed"

# Set proper permissions
print_status "Setting file permissions..."
chmod -R 755 backend/uploads
chmod -R 755 logs
chmod -R 755 backups
chmod +x scripts/*.sh

print_success "File permissions set"

# Generate SSL certificate (self-signed for development)
if [ ! -f ssl/server.crt ]; then
    print_status "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/server.key \
        -out ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    print_warning "Self-signed SSL certificate generated. Replace with proper certificate for production!"
fi

# Create systemd service files
print_status "Creating systemd service files..."
sudo tee /etc/systemd/system/crm-backend.service > /dev/null <<EOF
[Unit]
Description=CRM Backend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service files created"

# Enable and start services
print_status "Enabling services..."
sudo systemctl daemon-reload
sudo systemctl enable crm-backend.service

print_success "Services enabled"

print_success "🎉 Production setup completed!"
print_warning "⚠️  Important next steps:"
echo "1. Update backend/.env with your production database credentials"
echo "2. Update frontend/.env.production with your production API URL"
echo "3. Replace self-signed SSL certificate with proper certificate"
echo "4. Configure your domain DNS to point to this server"
echo "5. Set up automated backups"
echo "6. Configure monitoring and logging"
echo ""
echo "To start the application:"
echo "  sudo systemctl start crm-backend"
echo "  docker-compose -f docker-compose.production.yml up -d"
