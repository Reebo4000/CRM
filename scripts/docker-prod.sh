#!/bin/bash

# Gemini CRM - Production Docker Script
# This script helps manage the production Docker environment

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

# Function to start production environment
start_prod() {
    print_status "Starting Gemini CRM production environment..."
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.production .env
        print_status "Created .env file from .env.production"
    fi
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml up --build -d
    
    print_success "Production environment started!"
    print_status "Services available at:"
    echo "  - Application: http://localhost"
    echo "  - Backend API: http://localhost/api"
}

# Function to stop production environment
stop_prod() {
    print_status "Stopping Gemini CRM production environment..."
    docker-compose -f docker-compose.prod.yml down
    print_success "Production environment stopped!"
}

# Function to restart production environment
restart_prod() {
    print_status "Restarting Gemini CRM production environment..."
    docker-compose -f docker-compose.prod.yml restart
    print_success "Production environment restarted!"
}

# Function to view logs
logs_prod() {
    if [ -n "$1" ]; then
        docker-compose -f docker-compose.prod.yml logs -f "$1"
    else
        docker-compose -f docker-compose.prod.yml logs -f
    fi
}

# Function to run database migrations
migrate_prod() {
    print_warning "Running database migrations in production..."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
        print_success "Database migrations completed!"
    else
        print_status "Migration cancelled."
    fi
}

# Function to create database backup
backup_prod() {
    print_status "Creating database backup..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres -d gemini_crm_prod > "./backups/$BACKUP_NAME"
    print_success "Database backup created: ./backups/$BACKUP_NAME"
}

# Function to restore database from backup
restore_prod() {
    if [ -z "$1" ]; then
        print_error "Please specify backup file path"
        exit 1
    fi
    
    print_warning "This will restore the database from backup. All current data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restoring database from backup..."
        docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d gemini_crm_prod < "$1"
        print_success "Database restored from backup!"
    else
        print_status "Restore cancelled."
    fi
}

# Function to update production environment
update_prod() {
    print_status "Updating Gemini CRM production environment..."
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Rebuild and restart services
    docker-compose -f docker-compose.prod.yml up --build -d
    
    # Clean up old images
    docker image prune -f
    
    print_success "Production environment updated!"
}

# Function to show status
status_prod() {
    print_status "Production environment status:"
    docker-compose -f docker-compose.prod.yml ps
    
    print_status "System resources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to show health status
health_prod() {
    print_status "Health check status:"
    docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
}

# Function to scale services
scale_prod() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        print_error "Usage: $0 scale <service> <replicas>"
        exit 1
    fi
    
    print_status "Scaling $1 to $2 replicas..."
    docker-compose -f docker-compose.prod.yml up -d --scale "$1=$2"
    print_success "Service $1 scaled to $2 replicas!"
}

# Main script logic
case "$1" in
    start)
        check_docker
        check_docker_compose
        start_prod
        ;;
    stop)
        check_docker
        check_docker_compose
        stop_prod
        ;;
    restart)
        check_docker
        check_docker_compose
        restart_prod
        ;;
    logs)
        check_docker
        check_docker_compose
        logs_prod "$2"
        ;;
    migrate)
        check_docker
        check_docker_compose
        migrate_prod
        ;;
    backup)
        check_docker
        check_docker_compose
        mkdir -p backups
        backup_prod
        ;;
    restore)
        check_docker
        check_docker_compose
        restore_prod "$2"
        ;;
    update)
        check_docker
        check_docker_compose
        update_prod
        ;;
    status)
        check_docker
        check_docker_compose
        status_prod
        ;;
    health)
        check_docker
        check_docker_compose
        health_prod
        ;;
    scale)
        check_docker
        check_docker_compose
        scale_prod "$2" "$3"
        ;;
    *)
        echo "Gemini CRM Production Docker Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|logs|migrate|backup|restore|update|status|health|scale}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the production environment"
        echo "  stop     - Stop the production environment"
        echo "  restart  - Restart the production environment"
        echo "  logs     - View logs (optionally specify service name)"
        echo "  migrate  - Run database migrations"
        echo "  backup   - Create database backup"
        echo "  restore  - Restore database from backup file"
        echo "  update   - Update production environment"
        echo "  status   - Show status and resource usage"
        echo "  health   - Show health check status"
        echo "  scale    - Scale a service to specified replicas"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 backup"
        echo "  $0 restore ./backups/backup_20240101_120000.sql"
        echo "  $0 scale backend 3"
        exit 1
        ;;
esac
