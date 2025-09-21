#!/bin/bash

# Gemini CRM Setup Script
# This script automates the setup process for the Gemini CRM system

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_VERSION="16.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed"
        return 1
    fi
}

# Function to check PostgreSQL
check_postgresql() {
    if command_exists psql; then
        print_success "PostgreSQL is installed"
        return 0
    else
        print_error "PostgreSQL is not installed"
        return 1
    fi
}

# Function to create database
create_database() {
    print_status "Creating PostgreSQL database..."
    
    read -p "Enter PostgreSQL username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -p "Enter database name (default: gemini_crm): " DB_NAME
    DB_NAME=${DB_NAME:-gemini_crm}
    
    # Check if database exists
    if psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_warning "Database $DB_NAME already exists"
        read -p "Do you want to drop and recreate it? (y/N): " RECREATE_DB
        if [[ $RECREATE_DB =~ ^[Yy]$ ]]; then
            dropdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
            createdb -U "$DB_USER" "$DB_NAME"
            print_success "Database $DB_NAME recreated"
        fi
    else
        createdb -U "$DB_USER" "$DB_NAME"
        print_success "Database $DB_NAME created"
    fi
}

# Function to setup backend environment
setup_backend_env() {
    print_status "Setting up backend environment..."
    
    cd backend
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
        else
            # Create basic .env file
            cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=gemini_crm_super_secret_jwt_key_$(date +%s)
JWT_EXPIRES_IN=7d

# API Configuration
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Integration API Key (for n8n/WhatsApp)
INTEGRATION_API_KEY=gemini_crm_integration_key_$(date +%s)
EOF
            print_success "Created basic .env file"
        fi
        
        print_warning "Please edit backend/.env file with your database password and other settings"
        read -p "Press Enter to continue after editing .env file..."
    else
        print_success "Backend .env file already exists"
    fi
    
    cd ..
}

# Function to setup frontend environment
setup_frontend_env() {
    print_status "Setting up frontend environment..."
    
    cd frontend
    
    if [ ! -f .env ]; then
        cat > .env << EOF
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Gemini CRM
EOF
        print_success "Created frontend .env file"
    else
        print_success "Frontend .env file already exists"
    fi
    
    cd ..
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    print_success "Backend dependencies installed"
    cd ..
    
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    print_success "Frontend dependencies installed"
    cd ..
}

# Function to setup database schema
setup_database_schema() {
    print_status "Setting up database schema..."
    cd backend
    
    if npm run setup-db; then
        print_success "Database schema created successfully"
    else
        print_error "Failed to create database schema"
        return 1
    fi
    
    cd ..
}

# Function to seed database
seed_database() {
    print_status "Seeding database with sample data..."
    cd backend
    
    if npm run seed; then
        print_success "Database seeded successfully"
    else
        print_error "Failed to seed database"
        return 1
    fi
    
    cd ..
}

# Function to run tests
run_tests() {
    print_status "Running system tests..."
    cd backend
    
    # Start backend in background for testing
    npm start &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    # Run tests
    if node test-complete-system.js; then
        print_success "All tests passed!"
    else
        print_warning "Some tests failed, but setup can continue"
    fi
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null || true
    
    cd ..
}

# Function to create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Development startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start Gemini CRM in development mode

echo "Starting Gemini CRM Development Environment..."

# Start backend
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend development server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Gemini CRM is starting up..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
EOF

    # Production startup script
    cat > start-prod.sh << 'EOF'
#!/bin/bash

# Start Gemini CRM in production mode

echo "Starting Gemini CRM Production Environment..."

# Build frontend
echo "Building frontend..."
cd frontend
npm run build

# Start backend with PM2
echo "Starting backend with PM2..."
cd ../backend
pm2 start ecosystem.config.js

echo "Gemini CRM started in production mode"
echo "Backend: http://localhost:5000"
echo "Frontend: Serve the frontend/dist directory with your web server"
EOF

    chmod +x start-dev.sh start-prod.sh
    print_success "Startup scripts created"
}

# Function to display final instructions
display_final_instructions() {
    print_success "Gemini CRM setup completed successfully!"
    echo ""
    echo "🎉 Setup Summary:"
    echo "  ✅ Dependencies installed"
    echo "  ✅ Database created and configured"
    echo "  ✅ Environment files created"
    echo "  ✅ Database schema initialized"
    echo "  ✅ Sample data loaded"
    echo "  ✅ Startup scripts created"
    echo ""
    echo "🚀 Next Steps:"
    echo ""
    echo "1. Start the development environment:"
    echo "   ./start-dev.sh"
    echo ""
    echo "2. Access the application:"
    echo "   Frontend: http://localhost:5174"
    echo "   Backend API: http://localhost:5000"
    echo ""
    echo "3. Login with default credentials:"
    echo "   Admin: admin@geminicrm.com / admin123"
    echo "   Staff: staff@geminicrm.com / staff123"
    echo ""
    echo "4. For production deployment:"
    echo "   - Edit backend/.env with production settings"
    echo "   - Install PM2: npm install -g pm2"
    echo "   - Run: ./start-prod.sh"
    echo ""
    echo "📚 Documentation:"
    echo "   - User Manual: docs/USER_MANUAL.md"
    echo "   - API Documentation: docs/API_DOCUMENTATION.md"
    echo "   - Deployment Guide: docs/DEPLOYMENT_GUIDE.md"
    echo ""
    echo "🆘 Support:"
    echo "   - Email: support@geminicrm.com"
    echo "   - Documentation: docs/"
    echo ""
    print_success "Happy CRM-ing! 🎯"
}

# Main setup function
main() {
    echo "🎯 Gemini CRM Setup Script"
    echo "=========================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        print_error "Please install Node.js 16.0.0 or higher"
        exit 1
    fi
    
    if ! check_postgresql; then
        print_error "Please install PostgreSQL"
        exit 1
    fi
    
    # Confirm setup
    echo ""
    read -p "Do you want to proceed with the setup? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled"
        exit 0
    fi
    
    # Run setup steps
    create_database
    setup_backend_env
    setup_frontend_env
    install_dependencies
    setup_database_schema
    seed_database
    create_startup_scripts
    
    # Optional test run
    echo ""
    read -p "Do you want to run system tests? (y/N): " RUN_TESTS
    if [[ $RUN_TESTS =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main "$@"
