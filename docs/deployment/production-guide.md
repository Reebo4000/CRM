# Gemini CRM - Production Deployment Guide

This comprehensive guide provides step-by-step instructions for deploying the Gemini CRM application to production environments with proper security, monitoring, and maintenance procedures.

## 🎯 Overview

The Gemini CRM is a full-stack application consisting of:
- **Backend**: Node.js/Express API server with PostgreSQL database
- **Frontend**: React/Vite application with internationalization (Arabic/English)
- **Features**: Real-time notifications, PDF exports, role-based access control

## 📋 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ LTS (recommended) or CentOS 8+
- **CPU**: Minimum 2 cores (4 cores recommended for production)
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB SSD (50GB+ recommended)
- **Network**: Static IP address, domain name, SSL certificate

### Required Software
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Nginx**: Latest stable version
- **PM2**: Process manager for Node.js
- **Git**: For code deployment
- **Certbot**: For SSL certificate management

## 🚀 Step-by-Step Production Deployment

### Step 1: Server Setup and Security

#### 1.1 Initial Server Configuration
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Create a dedicated user for the application
sudo adduser geminicrm
sudo usermod -aG sudo geminicrm

# Switch to the application user
su - geminicrm
```

#### 1.2 Install Required Software
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

#### 1.3 Configure Firewall
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432/tcp  # PostgreSQL (restrict to localhost in production)
sudo ufw enable
sudo ufw status
```

### Step 2: Database Setup

#### 2.1 PostgreSQL Configuration
```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database and user
CREATE DATABASE gemini_crm_prod;
CREATE USER gemini_crm_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE gemini_crm_prod TO gemini_crm_user;
ALTER USER gemini_crm_user CREATEDB;
\q
```

#### 2.2 Secure PostgreSQL
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Ensure these settings:
# listen_addresses = 'localhost'
# ssl = on
# log_connections = on
# log_disconnections = on

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Ensure local connections use md5 authentication
# local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### Step 3: Application Deployment

#### 3.1 Clone and Setup Application
```bash
# Create application directory
sudo mkdir -p /var/www/gemini-crm
sudo chown geminicrm:geminicrm /var/www/gemini-crm

# Clone the repository
cd /var/www/gemini-crm
git clone <your-repository-url> .

# Install backend dependencies
cd backend
npm ci --only=production

# Install frontend dependencies and build
cd ../frontend
npm ci
npm run build
```

#### 3.2 Environment Configuration

**Backend Environment (.env):**
```bash
cd /var/www/gemini-crm/backend
nano .env
```

```env
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gemini_crm_prod
DB_USER=gemini_crm_user
DB_PASSWORD=your_secure_password_here

# JWT Configuration (Generate secure keys)
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://yourdomain.com

# API Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# Integration API Key (for n8n/WhatsApp)
INTEGRATION_API_KEY=your_secure_integration_api_key

# Email Configuration (if using email notifications)
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_email_password
EMAIL_FROM=Gemini CRM <noreply@yourdomain.com>

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

# Security Headers
HELMET_ENABLED=true
CORS_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/gemini-crm/app.log
```

#### 3.3 Database Migration
```bash
cd /var/www/gemini-crm/backend

# Run database migrations
npm run db:migrate

# Seed with initial data
npm run db:seed
```

### Step 4: Process Management with PM2

#### 4.1 Create PM2 Ecosystem Configuration
```bash
cd /var/www/gemini-crm
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'gemini-crm-backend',
    script: './backend/server.js',
    cwd: '/var/www/gemini-crm',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/gemini-crm/error.log',
    out_file: '/var/log/gemini-crm/out.log',
    log_file: '/var/log/gemini-crm/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### 4.2 Setup Logging Directory
```bash
# Create log directory
sudo mkdir -p /var/log/gemini-crm
sudo chown geminicrm:geminicrm /var/log/gemini-crm

# Setup log rotation
sudo nano /etc/logrotate.d/gemini-crm
```

```
/var/log/gemini-crm/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 geminicrm geminicrm
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 4.3 Start Application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above

# Monitor the application
pm2 monit
```

### Step 5: Nginx Configuration

#### 5.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/gemini-crm
```

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream backend
upstream gemini_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend static files
    location / {
        root /var/www/gemini-crm/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API endpoints
    location /api {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://gemini_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://gemini_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /api/uploads {
        client_max_body_size 10M;
        proxy_pass http://gemini_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO for real-time notifications
    location /socket.io/ {
        proxy_pass http://gemini_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5.2 Enable Site and SSL
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/gemini-crm /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Setup automatic SSL renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🔒 Security Hardening

### Step 6: Additional Security Measures

#### 6.1 Fail2Ban Configuration
```bash
# Install Fail2Ban
sudo apt install fail2ban

# Create custom jail for Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
```

```bash
# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

#### 6.2 System Security Updates
```bash
# Setup automatic security updates
sudo apt install unattended-upgrades

# Configure automatic updates
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### 6.3 File Permissions
```bash
# Set proper file permissions
sudo chown -R geminicrm:geminicrm /var/www/gemini-crm
sudo chmod -R 755 /var/www/gemini-crm
sudo chmod -R 644 /var/www/gemini-crm/backend/.env

# Secure uploads directory
sudo mkdir -p /var/www/gemini-crm/backend/uploads
sudo chown -R geminicrm:www-data /var/www/gemini-crm/backend/uploads
sudo chmod -R 775 /var/www/gemini-crm/backend/uploads
```

## 📊 Monitoring and Maintenance

### Step 7: Monitoring Setup

#### 7.1 System Monitoring with htop and iotop
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs
```

#### 7.2 Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs gemini-crm-backend

# Application health check
curl -f https://yourdomain.com/api/health
```

#### 7.3 Database Monitoring
```bash
# PostgreSQL monitoring queries
sudo -u postgres psql gemini_crm_prod

-- Check database size
SELECT pg_size_pretty(pg_database_size('gemini_crm_prod'));

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Step 8: Backup Strategy

#### 8.1 Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-gemini-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gemini-crm"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="gemini_crm_prod"
DB_USER="gemini_crm_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-gemini-db.sh

# Setup daily backup cron job
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-gemini-db.sh
```

#### 8.2 Application Files Backup
```bash
# Create application backup script
sudo nano /usr/local/bin/backup-gemini-files.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gemini-crm"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/gemini-crm"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads and configuration
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz \
    $APP_DIR/backend/uploads \
    $APP_DIR/backend/.env \
    $APP_DIR/ecosystem.config.js

# Keep only last 30 days of backups
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +30 -delete

echo "Files backup completed: files_backup_$DATE.tar.gz"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-gemini-files.sh

# Add to daily cron job
sudo crontab -e
# Add: 0 3 * * * /usr/local/bin/backup-gemini-files.sh
```

## 🔄 Deployment and Updates

### Step 9: Deployment Automation

#### 9.1 Create Deployment Script
```bash
nano /var/www/gemini-crm/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "🚀 Starting Gemini CRM deployment..."

# Pull latest changes
git pull origin main

# Backend updates
cd backend
echo "📦 Installing backend dependencies..."
npm ci --only=production

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate

# Frontend updates
cd ../frontend
echo "🎨 Building frontend..."
npm ci
npm run build

# Restart application
echo "🔄 Restarting application..."
pm2 restart gemini-crm-backend

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f https://yourdomain.com/api/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
```

```bash
# Make script executable
chmod +x /var/www/gemini-crm/deploy.sh
```

#### 9.2 Zero-Downtime Deployment
```bash
# For zero-downtime deployments, use PM2 reload
pm2 reload gemini-crm-backend

# Or use blue-green deployment strategy
pm2 start ecosystem.config.js --name gemini-crm-backend-new
# Test new instance
pm2 delete gemini-crm-backend
pm2 restart gemini-crm-backend-new --name gemini-crm-backend
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Application Won't Start
```bash
# Check PM2 logs
pm2 logs gemini-crm-backend

# Check system resources
free -h
df -h

# Check database connection
sudo -u postgres psql gemini_crm_prod -c "SELECT 1;"
```

#### Issue 2: High Memory Usage
```bash
# Monitor memory usage
pm2 monit

# Restart application if needed
pm2 restart gemini-crm-backend

# Check for memory leaks in logs
pm2 logs gemini-crm-backend | grep -i "memory\|heap"
```

#### Issue 3: SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

#### Issue 4: Database Performance
```bash
# Check database performance
sudo -u postgres psql gemini_crm_prod

-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Analyze table statistics
ANALYZE;

-- Reindex if needed
REINDEX DATABASE gemini_crm_prod;
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id);
CREATE INDEX CONCURRENTLY idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY idx_notifications_created_at ON notifications(created_at);

-- Configure PostgreSQL for production
-- Edit /etc/postgresql/14/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Application Optimization
```bash
# Enable Node.js production optimizations
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=1024"

# Use PM2 cluster mode for better performance
pm2 start ecosystem.config.js
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application logs
- Check system resources
- Verify backup completion

#### Weekly
- Review security logs
- Update system packages
- Check SSL certificate status

#### Monthly
- Review database performance
- Clean up old log files
- Update application dependencies
- Security audit

### Emergency Contacts
- System Administrator: [Your Contact]
- Database Administrator: [Your Contact]
- Development Team: [Your Contact]

### Documentation Links
- Application Documentation: `/README.md`
- API Documentation: `/API_DOCUMENTATION.md`
- Development Setup: `/DEVELOPMENT.md`

---

## 🎯 Production Checklist

Before going live, ensure all items are completed:

### Security
- [ ] SSL certificate installed and configured
- [ ] Firewall configured and enabled
- [ ] Fail2Ban installed and configured
- [ ] Database secured with strong passwords
- [ ] File permissions set correctly
- [ ] Security headers configured in Nginx
- [ ] Rate limiting enabled

### Performance
- [ ] Database indexes created
- [ ] Nginx gzip compression enabled
- [ ] Static file caching configured
- [ ] PM2 cluster mode enabled
- [ ] Database connection pooling configured

### Monitoring
- [ ] Application monitoring setup
- [ ] Log rotation configured
- [ ] Health check endpoints working
- [ ] Backup scripts tested
- [ ] Alert notifications configured

### Deployment
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Frontend built and deployed
- [ ] PM2 startup script configured
- [ ] Deployment script tested

### Testing
- [ ] All API endpoints tested
- [ ] Frontend functionality verified
- [ ] Real-time notifications working
- [ ] PDF export functionality tested
- [ ] Arabic/English language switching tested
- [ ] Role-based access control verified

---

**🎉 Congratulations! Your Gemini CRM is now ready for production use.**

For ongoing support and updates, refer to the maintenance schedule and contact information provided above.
