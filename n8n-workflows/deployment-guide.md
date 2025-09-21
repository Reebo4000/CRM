# Deployment Guide - Gemini CRM AI Customer Service Agent

## 🚀 Production Deployment Checklist

### Prerequisites Verification

#### System Requirements
- [ ] N8N instance (v1.0+ recommended)
- [ ] Node.js 18+ with npm/yarn
- [ ] LangChain nodes package installed
- [ ] SSL certificate for webhook endpoints
- [ ] Monitoring and logging infrastructure

#### API Access
- [ ] Gemini CRM running and accessible
- [ ] Integration API key configured and tested
- [ ] OpenAI API key with sufficient credits
- [ ] Telegram bot created and configured

#### Security Requirements
- [ ] Environment variables properly secured
- [ ] API keys rotated and stored securely
- [ ] Network security configured (firewalls, VPN)
- [ ] Backup and recovery procedures in place

## 📦 Deployment Package Contents

```
n8n-workflows/
├── gemini-crm-ai-agent-workflow.json     # Main workflow
├── error-handling-monitoring.json        # Error handling nodes
├── README.md                             # Overview and features
├── setup-guide.md                        # Detailed setup instructions
├── testing-procedures.md                 # Comprehensive testing guide
├── deployment-guide.md                   # This deployment guide
├── troubleshooting-guide.md              # Common issues and solutions
└── api-integration-examples.md           # CRM API integration examples
```

## 🔧 Step-by-Step Deployment

### Step 1: Environment Preparation

#### 1.1 N8N Configuration
```bash
# Install required packages
npm install @n8n/n8n-nodes-langchain

# Set environment variables
export N8N_ENCRYPTION_KEY="your-encryption-key"
export N8N_HOST="your-domain.com"
export N8N_PORT="5678"
export N8N_PROTOCOL="https"
export WEBHOOK_URL="https://your-domain.com"

# Production settings
export N8N_LOG_LEVEL="info"
export N8N_LOG_OUTPUT="file"
export N8N_METRICS="true"
```

#### 1.2 SSL Certificate Setup
```bash
# Using Let's Encrypt (example)
certbot certonly --standalone -d your-domain.com
```

#### 1.3 Reverse Proxy Configuration (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /webhook/ {
        proxy_pass http://localhost:5678/webhook/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### Step 2: Workflow Import and Configuration

#### 2.1 Import Main Workflow
1. Access N8N web interface
2. Navigate to Workflows
3. Click "Import from File"
4. Upload `gemini-crm-ai-agent-workflow.json`
5. Click "Import"

#### 2.2 Configure Credentials
```bash
# Create credentials in N8N UI:
# 1. Telegram Bot API
#    - Name: telegram-bot-credentials
#    - Access Token: [Your Bot Token]
#
# 2. OpenAI API
#    - Name: openai-credentials
#    - API Key: [Your OpenAI Key]
```

#### 2.3 Environment Variables Setup
```bash
# Add to N8N environment
GEMINI_CRM_API_KEY=your_integration_api_key
GEMINI_CRM_BASE_URL=http://localhost:5000/api
OPENAI_API_KEY=sk-your-openai-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ADMIN_WEBHOOK_URL=https://your-monitoring-system.com/alerts
```

### Step 3: Telegram Bot Configuration

#### 3.1 Set Webhook URL
```bash
BOT_TOKEN="your-telegram-bot-token"
WEBHOOK_URL="https://your-domain.com/webhook/telegram-webhook-crm"

curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"allowed_updates\": [\"message\", \"callback_query\"],
    \"drop_pending_updates\": true
  }"
```

#### 3.2 Configure Bot Settings
```bash
# Set bot description in Arabic
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setMyDescription" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "مساعد خدمة العملاء الذكي لشركة جيميني. يمكنني مساعدتك في الاستفسارات عن المنتجات والطلبات وتقديم التوصيات المناسبة لك.",
    "language_code": "ar"
  }'

# Set bot commands
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "بدء المحادثة والترحيب"},
      {"command": "products", "description": "عرض المنتجات المتاحة"},
      {"command": "orders", "description": "الاستعلام عن طلباتي"},
      {"command": "support", "description": "التواصل مع خدمة العملاء"},
      {"command": "help", "description": "المساعدة والإرشادات"}
    ],
    "language_code": "ar"
  }'
```

### Step 4: Error Handling and Monitoring Setup

#### 4.1 Import Error Handling Nodes
1. Import `error-handling-monitoring.json`
2. Integrate error handling nodes into main workflow
3. Configure admin notification webhooks

#### 4.2 Logging Configuration
```bash
# Create log directory
mkdir -p /var/log/n8n-workflows

# Configure log rotation
cat > /etc/logrotate.d/n8n-workflows << EOF
/var/log/n8n-workflows/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 n8n n8n
}
EOF
```

#### 4.3 Monitoring Setup
```javascript
// Add to workflow initialization
const setupMonitoring = () => {
  // Initialize global monitoring objects
  global.workflowMetrics = {
    startTime: Date.now(),
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageResponseTime: 0
  };
  
  // Health check endpoint
  setInterval(async () => {
    try {
      await global.performHealthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }, 300000); // Every 5 minutes
};

setupMonitoring();
```

### Step 5: Performance Optimization

#### 5.1 Database Connection Pooling
```javascript
// Optimize CRM API connections
const connectionPool = {
  maxConnections: 10,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};
```

#### 5.2 Caching Configuration
```javascript
// Product data caching
const cacheConfig = {
  productCacheTTL: 300000, // 5 minutes
  customerCacheTTL: 600000, // 10 minutes
  maxCacheSize: 1000
};
```

#### 5.3 Rate Limiting
```javascript
// Configure rate limits
const rateLimits = {
  perUser: {
    requests: 10,
    window: 60000 // 1 minute
  },
  global: {
    requests: 1000,
    window: 60000 // 1 minute
  }
};
```

## 🔍 Production Testing

### Smoke Tests
```bash
#!/bin/bash
# production-smoke-test.sh

echo "Running production smoke tests..."

# Test 1: Webhook connectivity
echo "1. Testing webhook..."
curl -X POST "https://your-domain.com/webhook/telegram-webhook-crm" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -w "HTTP Status: %{http_code}\n"

# Test 2: CRM connectivity
echo "2. Testing CRM integration..."
curl -X GET "http://localhost:5000/api/integration/health" \
  -H "X-API-Key: $GEMINI_CRM_API_KEY" \
  -w "HTTP Status: %{http_code}\n"

# Test 3: Bot info
echo "3. Testing Telegram bot..."
curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" \
  -w "HTTP Status: %{http_code}\n"

echo "Smoke tests completed!"
```

### Load Testing
```bash
# Use Apache Bench for basic load testing
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p test-payload.json \
   https://your-domain.com/webhook/telegram-webhook-crm
```

## 📊 Monitoring and Alerting

### Key Metrics to Monitor
- Response time per message
- Success/failure rates
- API usage and costs
- Memory and CPU usage
- Error rates by component
- Customer satisfaction scores

### Alerting Rules
```yaml
# Example Prometheus alerting rules
groups:
  - name: n8n-gemini-crm
    rules:
      - alert: HighResponseTime
        expr: avg_response_time > 5000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          
      - alert: HighErrorRate
        expr: error_rate > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

## 🔄 Backup and Recovery

### Workflow Backup
```bash
#!/bin/bash
# backup-workflow.sh

BACKUP_DIR="/backup/n8n-workflows"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Export workflow
curl -X GET "https://your-domain.com/api/workflows/export" \
  -H "Authorization: Bearer $N8N_API_TOKEN" \
  > "$BACKUP_DIR/gemini-crm-workflow_$DATE.json"

# Backup credentials (encrypted)
curl -X GET "https://your-domain.com/api/credentials/export" \
  -H "Authorization: Bearer $N8N_API_TOKEN" \
  > "$BACKUP_DIR/credentials_$DATE.json"

echo "Backup completed: $BACKUP_DIR"
```

### Recovery Procedure
```bash
#!/bin/bash
# restore-workflow.sh

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Import workflow
curl -X POST "https://your-domain.com/api/workflows/import" \
  -H "Authorization: Bearer $N8N_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$BACKUP_FILE"

echo "Workflow restored from: $BACKUP_FILE"
```

## 🚨 Security Considerations

### API Key Management
- Rotate API keys regularly (monthly)
- Use environment variables, never hardcode
- Implement key rotation without downtime
- Monitor API key usage and access

### Network Security
- Use HTTPS for all communications
- Implement IP whitelisting where possible
- Configure proper CORS settings
- Use VPN for internal API access

### Data Protection
- Encrypt sensitive data at rest
- Implement data retention policies
- Regular security audits
- GDPR compliance for customer data

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple N8N instances with load balancer
- Shared database for workflow state
- Redis for session management
- Queue system for high-volume processing

### Performance Optimization
- Database query optimization
- CDN for static assets
- Caching strategies
- Connection pooling

## 🔧 Maintenance Procedures

### Regular Tasks
- [ ] Monitor system health daily
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Backup workflows weekly
- [ ] Performance review monthly
- [ ] Security audit quarterly

### Update Procedures
1. Test updates in staging environment
2. Schedule maintenance window
3. Create backup before updates
4. Deploy updates incrementally
5. Monitor for issues post-deployment
6. Rollback plan if needed

## 📞 Support and Troubleshooting

### Common Issues
- Webhook connectivity problems
- API rate limiting
- Memory leaks in long-running workflows
- SSL certificate expiration
- Database connection issues

### Support Contacts
- Technical Support: [Your support email]
- Emergency Contact: [Emergency phone]
- Documentation: [Your docs URL]
- Status Page: [Your status page URL]

This deployment guide ensures a robust, scalable, and maintainable production deployment of your Gemini CRM AI Customer Service Agent.
