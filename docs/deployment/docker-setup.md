# Docker Deployment Setup

This guide covers Docker-based deployment for the Gemini CRM system. For the complete Docker deployment guide, see [Docker Deployment Guide](./docker-deployment.md).

## 🐳 Quick Docker Setup

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for containers
- At least 10GB disk space

### Initial Setup
```bash
# Run the setup script
chmod +x docker-setup.sh
./docker-setup.sh
```

## 🚀 Development Environment

Start the development environment with hot reload:
```bash
# Start all services
./scripts/docker-dev.sh start

# Run database migrations
./scripts/docker-dev.sh migrate

# Seed database with sample data
./scripts/docker-dev.sh seed
```

**Access URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- pgAdmin: http://localhost:8080 (admin@geminicrm.local / admin123)

## 🏭 Production Environment

Deploy to production:
```bash
# Start production environment
./scripts/docker-prod.sh start

# Run database migrations
./scripts/docker-prod.sh migrate
```

**Access URL:**
- Application: http://localhost

## 📋 Available Commands

### Development Commands
```bash
./scripts/docker-dev.sh start     # Start development environment
./scripts/docker-dev.sh stop      # Stop development environment
./scripts/docker-dev.sh restart   # Restart services
./scripts/docker-dev.sh logs      # View logs
./scripts/docker-dev.sh migrate   # Run database migrations
./scripts/docker-dev.sh seed      # Seed database
./scripts/docker-dev.sh clean     # Clean up everything
./scripts/docker-dev.sh status    # Check service status
./scripts/docker-dev.sh shell     # Open shell in container
```

### Production Commands
```bash
./scripts/docker-prod.sh start    # Start production environment
./scripts/docker-prod.sh stop     # Stop production environment
./scripts/docker-prod.sh restart  # Restart services
./scripts/docker-prod.sh logs     # View logs
./scripts/docker-prod.sh migrate  # Run database migrations
./scripts/docker-prod.sh backup   # Create database backup
./scripts/docker-prod.sh restore  # Restore from backup
./scripts/docker-prod.sh update   # Update production environment
./scripts/docker-prod.sh status   # Show status and resource usage
./scripts/docker-prod.sh health   # Health check
./scripts/docker-prod.sh scale    # Scale services
```

## 🔧 Configuration

### Environment Files
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

### Docker Compose Files
- `docker-compose.dev.yml` - Development configuration
- `docker-compose.prod.yml` - Production configuration

### Key Services
- **Frontend**: React app with Vite (dev) or Nginx (prod)
- **Backend**: Node.js Express API server
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Admin**: pgAdmin 4 (development only)

## 🔒 Security Features

### Development
- Basic security headers
- Permissive CORS for development
- Debug information available

### Production
- Comprehensive security headers
- Strict CORS policy
- Non-root container users
- Resource limits
- Health checks
- Automated backups

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :5000
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   ./scripts/docker-dev.sh logs postgres
   ```

3. **Permission issues**
   ```bash
   # Fix script permissions
   chmod +x scripts/docker-dev.sh scripts/docker-prod.sh
   ```

### Log Access
```bash
# View all logs
./scripts/docker-dev.sh logs

# View specific service logs
./scripts/docker-dev.sh logs backend

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f backend
```

## 📚 Additional Resources

- **[Complete Docker Guide](./docker-deployment.md)** - Comprehensive Docker deployment documentation
- **[Production Guide](./production-guide.md)** - Manual production deployment
- **[Production Checklist](./production-checklist.md)** - Pre-deployment verification

---

**Note**: This is a summary guide. For complete Docker deployment instructions, troubleshooting, and advanced configuration, see the [Docker Deployment Guide](./docker-deployment.md).
