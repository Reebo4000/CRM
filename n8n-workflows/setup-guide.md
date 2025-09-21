# Complete Setup Guide - Gemini CRM AI Agent

## 🚀 Quick Start Guide

### Step 1: Prepare Your Environment

#### 1.1 Gemini CRM Setup
Ensure your Gemini CRM is running and accessible:

```bash
# Check CRM health
curl -X GET "http://localhost:5000/health"

# Test integration API
curl -X GET "http://localhost:5000/api/integration/health" \
  -H "X-API-Key: your_integration_api_key"
```

#### 1.2 Get Integration API Key
From your CRM `.env` file:
```bash
INTEGRATION_API_KEY=gemini_crm_integration_key_2024
```

### Step 2: Create Telegram Bot

#### 2.1 Create Bot with BotFather
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Choose a name: `Gemini CRM Assistant`
4. Choose a username: `gemini_crm_bot` (must end with 'bot')
5. Save the bot token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

#### 2.2 Configure Bot Settings
```bash
# Set bot description
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyDescription" \
  -H "Content-Type: application/json" \
  -d '{"description": "مساعد خدمة العملاء الذكي لشركة جيميني - يمكنني مساعدتك في الاستفسارات والمنتجات"}'

# Set bot commands
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "بدء المحادثة"},
      {"command": "products", "description": "عرض المنتجات"},
      {"command": "orders", "description": "طلباتي"},
      {"command": "support", "description": "تواصل مع الدعم"}
    ]
  }'
```

### Step 3: Setup N8N Environment

#### 3.1 Install Required Packages
```bash
# Install LangChain nodes (if not already installed)
npm install @n8n/n8n-nodes-langchain

# Restart N8N
pm2 restart n8n  # or your process manager
```

#### 3.2 Configure Environment Variables
Add to your N8N environment:

```bash
# .env file for N8N
GEMINI_CRM_API_KEY=gemini_crm_integration_key_2024
GEMINI_CRM_BASE_URL=http://localhost:5000/api
OPENAI_API_KEY=sk-your-openai-api-key-here
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Step 4: Import and Configure Workflow

#### 4.1 Import Workflow
1. Open N8N web interface
2. Click "Import from File" or "Import from URL"
3. Upload `gemini-crm-ai-agent-workflow.json`
4. Click "Import"

#### 4.2 Configure Credentials

**Telegram Bot API Credential:**
1. Go to Settings > Credentials
2. Create new credential: "Telegram Bot API"
3. Name: `telegram-bot-credentials`
4. Access Token: Your bot token

**OpenAI API Credential:**
1. Create new credential: "OpenAI API"
2. Name: `openai-credentials`
3. API Key: Your OpenAI API key

#### 4.3 Update Node Configurations

**Telegram Trigger Node:**
- Webhook ID: `telegram-webhook-crm`
- Credential: `telegram-bot-credentials`

**AI Agent Node:**
- Model: `gpt-4` or `gpt-3.5-turbo`
- Temperature: `0.7`
- Max Tokens: `1000`

### Step 5: Setup Webhook

#### 5.1 Get Webhook URL
From the Telegram Trigger node in N8N:
```
https://your-n8n-domain.com/webhook/telegram-webhook-crm
```

#### 5.2 Register Webhook with Telegram
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-n8n-domain.com/webhook/telegram-webhook-crm",
    "allowed_updates": ["message", "callback_query"]
  }'
```

#### 5.3 Verify Webhook
```bash
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Step 6: Test the Integration

#### 6.1 Basic Functionality Test
1. Open Telegram and search for your bot
2. Send `/start` command
3. Send a greeting in Arabic: "السلام عليكم"
4. Verify the bot responds in Arabic

#### 6.2 Customer Lookup Test
1. Send a message with a phone number
2. Check if the bot recognizes existing customers
3. Verify new customer creation for unknown users

#### 6.3 Product Recommendation Test
1. Ask about products: "عايز شنطة حريمي"
2. Verify product recommendations appear
3. Test interactive buttons

## 🔧 Advanced Configuration

### Custom AI Prompts

Edit the AI Agent node prompt for specific business needs:

```javascript
// Example: Add seasonal promotions
const seasonalPrompt = `
الآن في موسم الشتاء، اعرض على العملاء:
- معاطف وجاكيتات شتوية
- أحذية مقاومة للمطر
- إكسسوارات الشتاء

أسعار خاصة: خصم 20% على جميع منتجات الشتاء
`;
```

### Error Handling Enhancement

Add error handling nodes:

```javascript
// Error Handler Node
try {
  // Main workflow logic
} catch (error) {
  return {
    chatId: $json.chatId,
    message: "عذراً، حدث خطأ مؤقت. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.",
    error: error.message,
    timestamp: new Date().toISOString()
  };
}
```

### Performance Optimization

#### Caching Configuration
```javascript
// Product Cache Node
const cacheKey = `products_${new Date().toDateString()}`;
const cachedProducts = global.productCache?.[cacheKey];

if (cachedProducts) {
  return cachedProducts;
} else {
  // Fetch from API and cache
  const products = await fetchProducts();
  global.productCache = global.productCache || {};
  global.productCache[cacheKey] = products;
  return products;
}
```

#### Rate Limiting
```javascript
// Rate Limiter Node
const userId = $json.userContext.telegramId;
const now = Date.now();
const userRequests = global.userRequests?.[userId] || [];

// Clean old requests (older than 1 minute)
const recentRequests = userRequests.filter(time => now - time < 60000);

if (recentRequests.length >= 10) {
  return {
    chatId: $json.userContext.chatId,
    message: "يرجى الانتظار قليلاً قبل إرسال رسالة أخرى 🙏",
    rateLimited: true
  };
}

// Add current request
recentRequests.push(now);
global.userRequests = global.userRequests || {};
global.userRequests[userId] = recentRequests;
```

## 🔍 Monitoring & Debugging

### Enable Detailed Logging

Add logging nodes throughout the workflow:

```javascript
// Logger Node
const logData = {
  timestamp: new Date().toISOString(),
  userId: $json.userContext?.telegramId,
  chatId: $json.userContext?.chatId,
  message: $json.userContext?.messageText,
  intent: $json.intent,
  customerFound: !!$json.conversationContext?.customerData,
  recommendationsCount: $json.recommendedProducts?.length || 0
};

console.log('Workflow Log:', JSON.stringify(logData, null, 2));
return $input.all();
```

### Health Check Endpoint

Create a separate workflow for health monitoring:

```javascript
// Health Check Workflow
return {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  services: {
    crm: await checkCrmHealth(),
    openai: await checkOpenAiHealth(),
    telegram: await checkTelegramHealth()
  }
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Messages
```bash
# Check webhook status
curl -X GET "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Reset webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-n8n-domain.com/webhook/telegram-webhook-crm"
```

#### 2. CRM API Connection Issues
```bash
# Test CRM connectivity
curl -X GET "http://localhost:5000/api/integration/health" \
  -H "X-API-Key: your_api_key"

# Check CRM logs
tail -f backend/logs/app.log
```

#### 3. OpenAI API Errors
- Check API key validity
- Verify rate limits
- Monitor token usage
- Review error messages in N8N logs

#### 4. Arabic Text Display Issues
- Ensure UTF-8 encoding
- Check Telegram client language settings
- Verify font support for Arabic text

### Debug Mode

Enable debug mode in N8N:
```bash
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console,file
```

## 📊 Performance Metrics

Monitor these key metrics:
- Response time per message
- Customer satisfaction scores
- Successful product recommendations
- Error rates by component
- API usage and costs

## 🔄 Maintenance

### Regular Tasks
- Update AI prompts based on customer feedback
- Refresh product data cache
- Monitor and rotate API keys
- Review conversation logs for improvements
- Update bot commands and descriptions

### Backup Procedures
- Export workflow JSON regularly
- Backup conversation logs
- Save credential configurations
- Document custom modifications
