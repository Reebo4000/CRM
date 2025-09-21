#!/bin/bash

# Gemini CRM - Docker Setup Script
# This script sets up the Docker environment for the first time

set -e

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

# Function to check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker > /dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker and try again."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p backend/database-init
    mkdir -p scripts
    mkdir -p backups
    
    print_success "Directories created"
}

# Function to set up permissions
setup_permissions() {
    print_status "Setting up file permissions..."
    
    # Make scripts executable
    chmod +x scripts/docker-dev.sh 2>/dev/null || true
    chmod +x scripts/docker-prod.sh 2>/dev/null || true
    chmod +x docker-setup.sh 2>/dev/null || true
    
    print_success "Permissions set up"
}

# Function to validate configuration files
validate_config() {
    print_status "Validating configuration files..."
    
    # Check if required files exist
    required_files=(
        "docker-compose.dev.yml"
        "docker-compose.prod.yml"
        ".env.development"
        ".env.production"
        "backend/Dockerfile"
        "backend/Dockerfile.dev"
        "frontend/Dockerfile"
        "frontend/Dockerfile.dev"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file missing: $file"
            exit 1
        fi
    done
    
    print_success "Configuration files validated"
}

# Function to pull required Docker images
pull_images() {
    print_status "Pulling required Docker images..."
    
    docker pull node:18-alpine
    docker pull postgres:15-alpine
    docker pull redis:7-alpine
    docker pull nginx:alpine
    docker pull dpage/pgadmin4:latest
    
    print_success "Docker images pulled"
}

# Function to show setup summary
show_summary() {
    echo ""
    echo "🎉 Gemini CRM Docker Setup Complete!"
    echo "======================================"
    echo ""
    echo "📁 Files created:"
    echo "  ├── docker-compose.dev.yml      (Development configuration)"
    echo "  ├── docker-compose.prod.yml     (Production configuration)"
    echo "  ├── .env.development            (Development environment)"
    echo "  ├── .env.production             (Production environment)"
    echo "  ├── backend/Dockerfile          (Backend production image)"
    echo "  ├── backend/Dockerfile.dev      (Backend development image)"
    echo "  ├── frontend/Dockerfile         (Frontend production image)"
    echo "  ├── frontend/Dockerfile.dev     (Frontend development image)"
    echo "  ├── scripts/docker-dev.sh       (Development management)"
    echo "  ├── scripts/docker-prod.sh      (Production management)"
    echo "  └── DOCKER_README.md            (Detailed documentation)"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo ""
    echo "Development Environment:"
    echo "  ./scripts/docker-dev.sh start   # Start development environment"
    echo "  ./scripts/docker-dev.sh migrate # Run database migrations"
    echo "  ./scripts/docker-dev.sh seed    # Seed database with sample data"
    echo ""
    echo "Production Environment:"
    echo "  ./scripts/docker-prod.sh start  # Start production environment"
    echo "  ./scripts/docker-prod.sh migrate # Run database migrations"
    echo ""
    echo "📖 For detailed instructions, see DOCKER_README.md"
    echo ""
    echo "🌐 Access URLs (after starting):"
    echo "Development:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend API: http://localhost:5000/api"
    echo "  - pgAdmin: http://localhost:8080"
    echo ""
    echo "Production:"
    echo "  - Application: http://localhost"
    echo ""
}

# Main setup process
main() {
    echo "🐳 Gemini CRM Docker Setup"
    echo "=========================="
    echo ""
    
    check_docker
    check_docker_compose
    create_directories
    setup_permissions
    validate_config
    pull_images
    show_summary
    
    print_success "Setup completed successfully!"
    echo ""
    print_status "You can now start the development environment with:"
    echo "  ./scripts/docker-dev.sh start"
    echo ""
    print_status "Or start the production environment with:"
    echo "  ./scripts/docker-prod.sh start"
}

# Run main function
main
