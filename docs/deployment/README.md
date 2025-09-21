# Deployment Documentation

Complete deployment guides and resources for the Gemini CRM system.

## 🚀 Deployment Options

### Production Deployment
Choose from multiple deployment strategies:

1. **[Production Guide](./production-guide.md)** - Complete manual deployment guide
2. **[Docker Setup](./docker-setup.md)** - Containerized deployment (recommended)
3. **[Production Checklist](./production-checklist.md)** - Pre-deployment verification

## 📋 Quick Deployment

### Option 1: Docker Compose (Recommended)
```bash
# Initial setup
chmod +x docker-setup.sh
./docker-setup.sh

# Deploy production environment
./scripts/docker-prod.sh start
./scripts/docker-prod.sh migrate

# Verify deployment
./scripts/docker-prod.sh health
```

### Option 2: Manual Deployment
```bash
# Run setup script
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh

# Start services
npm run start
```

## 🛠️ Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ LTS (recommended) or CentOS 8+
- **CPU**: Minimum 2 cores (4 cores recommended)
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB SSD (50GB+ recommended)
- **Network**: Static IP, domain name, SSL certificate

### Required Software
- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose (for containerized deployment)
- Nginx (for reverse proxy)
- PM2 (for process management)
- Certbot (for SSL certificates)

## ⚙️ Environment Configuration

### Backend Environment (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_production
DB_USER=crm_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Environment (.env.production)
```env
# For Docker deployment
VITE_API_URL=http://localhost/api
VITE_SOCKET_URL=http://localhost

# For manual deployment with custom domain
# VITE_API_URL=https://api.yourdomain.com/api
# VITE_SOCKET_URL=https://yourdomain.com

VITE_APP_NAME=Gemini CRM
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

## 🔒 Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] Database user with limited privileges
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 80, 443, 5000)
- [ ] File upload restrictions in place
- [ ] Security headers enabled (Helmet)

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Application health (Docker)
./scripts/docker-prod.sh health

# View logs (Docker)
./scripts/docker-prod.sh logs

# Restart services (Docker)
./scripts/docker-prod.sh restart

# Manual health check
npm run health
```

### Database Management
```bash
# Create backup
npm run backup

# Restore from backup
npm run restore

# Run migrations
npm run migrate
```

### Updates
```bash
# Update application
git pull
npm run deploy:production
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL service status
   - Verify credentials in .env file
   - Ensure database exists and user has permissions

2. **PDF Generation Fails**
   - Check Puppeteer dependencies
   - Verify Chrome/Chromium installation
   - Check memory limits and disk space

3. **Frontend Build Fails**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

4. **Authentication Issues**
   - Check JWT_SECRET consistency
   - Verify token expiration settings
   - Check CORS configuration

### Log Locations
- Application logs: `./logs/app.log`
- Database backups: `./backups/`
- Upload files: `./backend/uploads/`

## 🔧 Available Scripts

```bash
# Development
npm run dev                 # Start both frontend and backend
npm run dev:backend        # Start backend only
npm run dev:frontend       # Start frontend only

# Production
npm run build              # Build both frontend and backend
npm run start              # Start production server
npm run deploy:production  # Full production deployment

# Docker (using management scripts - recommended)
./scripts/docker-dev.sh start    # Start development environment
./scripts/docker-prod.sh start   # Start production environment
./scripts/docker-prod.sh stop    # Stop production environment
./scripts/docker-prod.sh logs    # View logs

# Docker (using npm scripts)
npm run docker:build       # Build Docker images
npm run docker:up          # Start containers
npm run docker:down        # Stop containers
npm run docker:logs        # View logs
npm run docker:dev         # Start development containers

# Database
npm run migrate            # Run migrations
npm run seed              # Seed database
npm run backup            # Create backup
npm run restore           # Restore from backup

# Utilities
npm run health            # Check application health
npm run setup             # Install dependencies
```

## 📞 Support

For deployment issues:
1. Check the [production checklist](./production-checklist.md)
2. Review logs: `npm run docker:logs`
3. Verify health status: `npm run health`
4. Consult the [troubleshooting section](./production-guide.md#troubleshooting)

---

**Last Updated**: January 2025
**Deployment Version**: 1.0.0
