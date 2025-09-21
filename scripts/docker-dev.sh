#!/bin/bash

# Gemini CRM - Development Docker Script
# This script helps manage the development Docker environment

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to start development environment
start_dev() {
    print_status "Starting Gemini CRM development environment..."
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.development .env
        print_status "Created .env file from .env.development"
    fi
    
    # Build and start services
    docker-compose -f docker-compose.dev.yml up --build -d
    
    print_success "Development environment started!"
    print_status "Services available at:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend API: http://localhost:5000"
    echo "  - pgAdmin: http://localhost:8080 (admin@geminicrm.local / admin123)"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
}

# Function to stop development environment
stop_dev() {
    print_status "Stopping Gemini CRM development environment..."
    docker-compose -f docker-compose.dev.yml down
    print_success "Development environment stopped!"
}

# Function to restart development environment
restart_dev() {
    print_status "Restarting Gemini CRM development environment..."
    docker-compose -f docker-compose.dev.yml restart
    print_success "Development environment restarted!"
}

# Function to view logs
logs_dev() {
    if [ -n "$1" ]; then
        docker-compose -f docker-compose.dev.yml logs -f "$1"
    else
        docker-compose -f docker-compose.dev.yml logs -f
    fi
}

# Function to run database migrations
migrate_dev() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate
    print_success "Database migrations completed!"
}

# Function to seed database
seed_dev() {
    print_status "Seeding database..."
    docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
    print_success "Database seeding completed!"
}

# Function to clean up development environment
clean_dev() {
    print_warning "This will remove all containers, volumes, and images for the development environment."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up development environment..."
        docker-compose -f docker-compose.dev.yml down -v --rmi all
        docker system prune -f
        print_success "Development environment cleaned up!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show status
status_dev() {
    print_status "Development environment status:"
    docker-compose -f docker-compose.dev.yml ps
}

# Function to open shell in container
shell_dev() {
    if [ -n "$1" ]; then
        docker-compose -f docker-compose.dev.yml exec "$1" sh
    else
        print_error "Please specify a service name (backend, frontend, postgres, redis)"
        exit 1
    fi
}

# Main script logic
case "$1" in
    start)
        check_docker
        check_docker_compose
        start_dev
        ;;
    stop)
        check_docker
        check_docker_compose
        stop_dev
        ;;
    restart)
        check_docker
        check_docker_compose
        restart_dev
        ;;
    logs)
        check_docker
        check_docker_compose
        logs_dev "$2"
        ;;
    migrate)
        check_docker
        check_docker_compose
        migrate_dev
        ;;
    seed)
        check_docker
        check_docker_compose
        seed_dev
        ;;
    clean)
        check_docker
        check_docker_compose
        clean_dev
        ;;
    status)
        check_docker
        check_docker_compose
        status_dev
        ;;
    shell)
        check_docker
        check_docker_compose
        shell_dev "$2"
        ;;
    *)
        echo "Gemini CRM Development Docker Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|logs|migrate|seed|clean|status|shell}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the development environment"
        echo "  stop     - Stop the development environment"
        echo "  restart  - Restart the development environment"
        echo "  logs     - View logs (optionally specify service name)"
        echo "  migrate  - Run database migrations"
        echo "  seed     - Seed the database with sample data"
        echo "  clean    - Clean up all containers, volumes, and images"
        echo "  status   - Show status of all services"
        echo "  shell    - Open shell in specified container"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 shell backend"
        exit 1
        ;;
esac
