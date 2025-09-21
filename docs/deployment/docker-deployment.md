# Gemini CRM - Docker Deployment Guide

This guide provides comprehensive instructions for deploying the Gemini CRM application using Docker in both development and production environments.

## 📋 Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- Git
- At least 4GB RAM available for containers
- At least 10GB disk space

## 🏗️ Architecture Overview

The application consists of the following services:

### Development Environment
- **Frontend**: React + Vite development server (Port 5173)
- **Backend**: Node.js + Express API server (Port 5000)
- **Database**: PostgreSQL 15 (Port 5432)
- **Cache**: Redis 7 (Port 6379)
- **Admin**: pgAdmin 4 (Port 8080)

### Production Environment
- **Frontend**: Nginx serving built React app (Port 80)
- **Backend**: Node.js + Express API server (Internal)
- **Database**: PostgreSQL 15 (Internal)
- **Cache**: Redis 7 (Internal)
- **Backup**: Automated database backup service
- **Monitoring**: Watchtower for auto-updates

## 🚀 Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gemini-crm
   ```

2. **Start development environment**
   ```bash
   chmod +x scripts/docker-dev.sh
   ./scripts/docker-dev.sh start
   ```

3. **Run database migrations**
   ```bash
   ./scripts/docker-dev.sh migrate
   ```

4. **Seed the database (optional)**
   ```bash
   ./scripts/docker-dev.sh seed
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - pgAdmin: http://localhost:8080 (admin@geminicrm.local / admin123)

### Production Environment

1. **Prepare production environment**
   ```bash
   chmod +x scripts/docker-prod.sh
   ./scripts/docker-prod.sh start
   ```

2. **Run database migrations**
   ```bash
   ./scripts/docker-prod.sh migrate
   ```

3. **Access the application**
   - Application: http://localhost

## 📁 File Structure

```
gemini-crm/
├── backend/
│   ├── Dockerfile              # Production backend image
│   ├── Dockerfile.dev          # Development backend image
│   ├── .dockerignore
│   └── database-init/          # Database initialization scripts
├── frontend/
│   ├── Dockerfile              # Production frontend image
│   ├── Dockerfile.dev          # Development frontend image
│   ├── .dockerignore
│   └── nginx.conf              # Nginx configuration
├── scripts/
│   ├── docker-dev.sh           # Development management script
│   └── docker-prod.sh          # Production management script
├── docker-compose.dev.yml      # Development configuration
├── docker-compose.prod.yml     # Production configuration
├── .env.development            # Development environment variables
├── .env.production             # Production environment variables
└── docs/deployment/docker-deployment.md  # This file
```

## 🛠️ Management Scripts

### Development Script (`./scripts/docker-dev.sh`)

```bash
# Start development environment
./scripts/docker-dev.sh start

# Stop development environment
./scripts/docker-dev.sh stop

# Restart services
./scripts/docker-dev.sh restart

# View logs (all services or specific service)
./scripts/docker-dev.sh logs
./scripts/docker-dev.sh logs backend

# Run database migrations
./scripts/docker-dev.sh migrate

# Seed database with sample data
./scripts/docker-dev.sh seed

# Check service status
./scripts/docker-dev.sh status

# Open shell in container
./scripts/docker-dev.sh shell backend

# Clean up everything (containers, volumes, images)
./scripts/docker-dev.sh clean
```

### Production Script (`./scripts/docker-prod.sh`)

```bash
# Start production environment
./scripts/docker-prod.sh start

# Stop production environment
./scripts/docker-prod.sh stop

# View logs
./scripts/docker-prod.sh logs

# Run database migrations
./scripts/docker-prod.sh migrate

# Create database backup
./scripts/docker-prod.sh backup

# Restore from backup
./scripts/docker-prod.sh restore ./backups/backup_20240101_120000.sql

# Update production environment
./scripts/docker-prod.sh update

# Check status and resource usage
./scripts/docker-prod.sh status

# Health check
./scripts/docker-prod.sh health

# Scale services
./scripts/docker-prod.sh scale backend 3
```

## 🔧 Configuration

### Environment Variables

#### Development (`.env.development`)
- Database: `gemini_crm` on localhost:5432
- JWT expires in 24 hours
- Debug logging enabled
- CORS allows multiple origins
- Higher rate limits

#### Production (`.env.production`)
- Database: `gemini_crm_prod` (internal network)
- JWT expires in 8 hours
- Warning-level logging
- Strict CORS policy
- Lower rate limits
- Security headers enabled

### Database Configuration

The PostgreSQL database is automatically initialized with:
- UTF8 encoding
- Required extensions (uuid-ossp, pg_trgm)
- Timezone set to UTC
- Read-only user for reporting

### Security Features

#### Development
- Basic security headers
- Permissive CORS for development
- Debug information available

#### Production
- Comprehensive security headers
- Strict CORS policy
- Non-root container users
- Resource limits
- Health checks
- Automated backups

## 📊 Monitoring and Maintenance

### Health Checks
All services include health checks:
- **Backend**: HTTP health endpoint
- **Frontend**: HTTP availability check
- **Database**: PostgreSQL connection test
- **Redis**: Ping command

### Backups
Production environment includes:
- Daily automated database backups
- 30-day backup retention
- Manual backup/restore commands

### Resource Limits
Production containers have resource limits:
- **Backend**: 1GB memory limit, 512MB reserved
- **Frontend**: 128MB memory limit, 64MB reserved
- **Database**: 512MB memory limit, 256MB reserved
- **Redis**: 256MB memory limit, 128MB reserved

### Auto-Updates
Watchtower service automatically:
- Checks for image updates daily
- Updates containers with new images
- Cleans up old images

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :5000
   
   # Stop conflicting services or change ports in docker-compose files
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   ./scripts/docker-dev.sh logs postgres
   
   # Restart database service
   docker-compose -f docker-compose.dev.yml restart postgres
   ```

3. **Frontend build issues**
   ```bash
   # Rebuild frontend container
   docker-compose -f docker-compose.dev.yml build --no-cache frontend
   ```

4. **Permission issues**
   ```bash
   # Fix script permissions
   chmod +x scripts/docker-dev.sh scripts/docker-prod.sh
   ```

### Logs and Debugging

```bash
# View all logs
./scripts/docker-dev.sh logs

# View specific service logs
./scripts/docker-dev.sh logs backend

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f backend

# Check container status
docker-compose -f docker-compose.dev.yml ps
```

## 🔄 Updates and Maintenance

### Development Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./scripts/docker-dev.sh restart
```

### Production Updates
```bash
# Update production environment
./scripts/docker-prod.sh update

# Or manual update
git pull origin main
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📝 Notes

- All services use localhost domain as requested
- Development environment includes hot reload for both frontend and backend
- Production environment is optimized for performance and security
- Database data persists in Docker volumes
- Upload files are stored in persistent volumes
- Both environments are fully functional and independent

## 🆘 Support

For issues or questions:
1. Check the logs using the management scripts
2. Review the troubleshooting section
3. Check Docker and Docker Compose versions
4. Ensure sufficient system resources are available
