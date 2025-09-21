# Troubleshooting Guide - Gemini CRM AI Agent

## 🔧 Common Issues and Solutions

### 1. Telegram Webhook Issues

#### Problem: Bot not receiving messages
**Symptoms:**
- Messages sent to bot but no response
- Webhook URL returns 404 or 500 errors
- N8N workflow not triggering

**Solutions:**

```bash
# Check webhook status
curl -X GET "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Expected response should show your webhook URL
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/webhook/telegram-webhook-crm",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}

# If webhook is not set or incorrect:
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/webhook/telegram-webhook-crm"}'

# Clear webhook if needed
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

**Debug Steps:**
1. Verify N8N workflow is active
2. Check webhook URL accessibility
3. Verify SSL certificate validity
4. Check N8N logs for errors

#### Problem: SSL certificate errors
**Symptoms:**
- Telegram shows "SSL error" in webhook info
- Webhook fails with certificate validation errors

**Solutions:**
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Verify certificate chain
curl -I https://your-domain.com/webhook/telegram-webhook-crm

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

### 2. CRM API Connection Issues

#### Problem: CRM API authentication failures
**Symptoms:**
- HTTP 401 Unauthorized errors
- "Invalid API key" messages
- CRM integration nodes failing

**Solutions:**

```bash
# Test API key manually
curl -X GET "http://localhost:5000/api/integration/health" \
  -H "X-API-Key: your_api_key_here"

# Expected response:
{
  "success": true,
  "message": "Integration API is healthy",
  "timestamp": "2024-01-21T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Debug Steps:**
1. Verify API key in environment variables
2. Check CRM server is running
3. Verify network connectivity
4. Check CRM logs for authentication attempts

#### Problem: CRM API timeouts
**Symptoms:**
- Requests taking too long
- Timeout errors in N8N logs
- Intermittent failures

**Solutions:**
```javascript
// Add timeout and retry logic in N8N Code node
const makeApiRequest = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) throw error;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. OpenAI API Issues

#### Problem: OpenAI API rate limits
**Symptoms:**
- "Rate limit exceeded" errors
- HTTP 429 responses
- Delayed or failed AI responses

**Solutions:**
```javascript
// Implement exponential backoff in N8N
const handleOpenAIRequest = async (prompt, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      });
      
      return response.choices[0].message.content;
      
    } catch (error) {
      if (error.status === 429) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded for OpenAI API');
};
```

#### Problem: OpenAI API quota exceeded
**Symptoms:**
- "Quota exceeded" errors
- Billing limit reached notifications
- API requests failing

**Solutions:**
1. Check OpenAI usage dashboard
2. Increase billing limits if needed
3. Implement usage monitoring
4. Add fallback responses

```javascript
// Fallback response system
const getAIResponse = async (prompt) => {
  try {
    return await callOpenAI(prompt);
  } catch (error) {
    if (error.message.includes('quota') || error.message.includes('billing')) {
      // Return predefined Arabic responses
      const fallbackResponses = {
        greeting: "أهلاً وسهلاً بيك! أقدر أساعدك في إيه النهارده؟",
        product_inquiry: "عندنا مجموعة حلوة من المنتجات. ممكن تقولي إيه اللي بتدور عليه؟",
        general: "عذراً، النظام مشغول شوية دلوقتي. ممكن تحاول تاني بعد شوية؟"
      };
      
      return fallbackResponses.general;
    }
    
    throw error;
  }
};
```

### 4. Arabic Text Processing Issues

#### Problem: Arabic text not displaying correctly
**Symptoms:**
- Garbled Arabic characters
- Question marks instead of Arabic text
- Text direction issues

**Solutions:**
```javascript
// Ensure proper UTF-8 encoding in N8N
const processArabicText = (text) => {
  // Normalize Arabic text
  const normalizedText = text
    .replace(/ي/g, 'ي') // Normalize Ya
    .replace(/ك/g, 'ك') // Normalize Kaf
    .trim();
  
  // Ensure proper encoding
  return Buffer.from(normalizedText, 'utf8').toString('utf8');
};

// In Telegram message sending
{
  "text": "{{ processArabicText($json.message) }}",
  "parse_mode": "HTML"
}
```

#### Problem: Arabic intent recognition failing
**Symptoms:**
- AI not understanding Arabic queries
- Wrong intent classification
- Poor response quality

**Solutions:**
```javascript
// Enhanced Arabic prompt for OpenAI
const arabicPrompt = `
أنت مساعد خدمة عملاء ذكي تتحدث العربية بطلاقة.

قواعد مهمة:
- استخدم اللهجة المصرية الودودة
- اعرف الفرق بين: "عايز" (يريد)، "محتاج" (يحتاج)، "بدور على" (يبحث عن)
- اعرف أسماء المنتجات بالعربية: شنطة، حقيبة، حذاء، جزمة، ساعة، إكسسوار
- اعرف كلمات الشكوى: مشكلة، عيب، مش عاجبني، عايز أرجع

الرسالة: "${customerMessage}"

حدد نوع الطلب وارد بطريقة مناسبة.
`;
```

### 5. Performance Issues

#### Problem: Slow response times
**Symptoms:**
- Customers waiting too long for responses
- Timeout errors
- Poor user experience

**Solutions:**
```javascript
// Performance monitoring and optimization
const optimizeWorkflow = () => {
  // 1. Cache frequently accessed data
  const productCache = global.productCache || {};
  const cacheKey = `products_${new Date().toDateString()}`;
  
  if (productCache[cacheKey]) {
    return productCache[cacheKey];
  }
  
  // 2. Parallel API calls where possible
  const [customerData, productData] = await Promise.all([
    fetchCustomerData(userId),
    fetchProductData()
  ]);
  
  // 3. Limit AI response length
  const aiConfig = {
    max_tokens: 500, // Shorter responses
    temperature: 0.5 // More focused responses
  };
  
  return { customerData, productData };
};
```

#### Problem: Memory leaks in long-running workflows
**Symptoms:**
- N8N memory usage increasing over time
- Workflow becoming slower
- System crashes

**Solutions:**
```javascript
// Memory management in N8N
const cleanupMemory = () => {
  // Clear old cache entries
  if (global.productCache) {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    Object.keys(global.productCache).forEach(key => {
      if (now - global.productCache[key].timestamp > maxAge) {
        delete global.productCache[key];
      }
    });
  }
  
  // Limit conversation history
  if (global.conversationHistory) {
    Object.keys(global.conversationHistory).forEach(userId => {
      const history = global.conversationHistory[userId];
      if (history.length > 50) {
        global.conversationHistory[userId] = history.slice(-25);
      }
    });
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupMemory, 10 * 60 * 1000);
```

### 6. Database Connection Issues

#### Problem: CRM database connection failures
**Symptoms:**
- Database connection errors in CRM logs
- API returning 500 errors
- Intermittent data access issues

**Solutions:**
```bash
# Check database connectivity
psql -h localhost -U postgres -d gemini_crm -c "SELECT 1;"

# Check connection pool status
curl -X GET "http://localhost:5000/api/health" | jq '.database'

# Restart CRM service if needed
pm2 restart gemini-crm-backend
```

### 7. Workflow Debugging

#### Problem: Workflow execution failures
**Symptoms:**
- Workflow stops at certain nodes
- Unexpected data flow
- Missing or incorrect data

**Debug Techniques:**
```javascript
// Add debug logging to nodes
const debugLog = (stepName, data) => {
  console.log(`[DEBUG] ${stepName}:`, JSON.stringify({
    timestamp: new Date().toISOString(),
    executionId: $execution.id,
    nodeId: $node.id,
    data: data
  }, null, 2));
};

// Usage in nodes
debugLog('Customer Lookup', {
  input: $input.all(),
  userId: $json.userContext?.telegramId,
  result: $json.customer
});
```

#### Problem: Data transformation errors
**Symptoms:**
- Incorrect data format between nodes
- Missing properties
- Type conversion errors

**Solutions:**
```javascript
// Robust data transformation
const safeTransform = (data, transformFn) => {
  try {
    if (!data) {
      throw new Error('No data provided');
    }
    
    const result = transformFn(data);
    
    // Validate result
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid transformation result');
    }
    
    return result;
    
  } catch (error) {
    console.error('Transformation error:', error);
    
    // Return safe default
    return {
      error: true,
      message: 'Data transformation failed',
      originalData: data,
      errorDetails: error.message
    };
  }
};
```

## 🔍 Diagnostic Tools

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

echo "🏥 Gemini CRM AI Agent Health Check"
echo "=================================="

# Check N8N status
echo "1. Checking N8N..."
if curl -s http://localhost:5678/healthz > /dev/null; then
    echo "   ✅ N8N is running"
else
    echo "   ❌ N8N is not responding"
fi

# Check CRM API
echo "2. Checking CRM API..."
if curl -s -H "X-API-Key: $GEMINI_CRM_API_KEY" http://localhost:5000/api/integration/health > /dev/null; then
    echo "   ✅ CRM API is healthy"
else
    echo "   ❌ CRM API is not responding"
fi

# Check Telegram bot
echo "3. Checking Telegram bot..."
if curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | grep -q '"ok":true'; then
    echo "   ✅ Telegram bot is active"
else
    echo "   ❌ Telegram bot is not responding"
fi

# Check webhook
echo "4. Checking webhook..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo")
if echo "$WEBHOOK_INFO" | grep -q "your-domain.com"; then
    echo "   ✅ Webhook is configured"
else
    echo "   ❌ Webhook is not configured properly"
fi

echo "Health check completed!"
```

### Log Analysis Script
```bash
#!/bin/bash
# analyze-logs.sh

echo "📊 Log Analysis Report"
echo "====================="

# Analyze N8N logs
echo "N8N Workflow Executions (last 24h):"
grep "Workflow execution" /var/log/n8n/*.log | \
  grep "$(date -d '24 hours ago' '+%Y-%m-%d')" | \
  wc -l

echo "Recent Errors:"
grep "ERROR" /var/log/n8n/*.log | tail -5

# Analyze CRM logs
echo "CRM API Requests (last hour):"
grep "$(date '+%Y-%m-%d %H')" /var/log/gemini-crm/*.log | \
  grep "integration" | wc -l

echo "CRM Errors:"
grep "ERROR" /var/log/gemini-crm/*.log | tail -3
```

## 📞 Getting Help

### Support Channels
1. **Technical Documentation**: Check all markdown files in this package
2. **N8N Community**: [community.n8n.io](https://community.n8n.io)
3. **OpenAI Support**: [help.openai.com](https://help.openai.com)
4. **Telegram Bot API**: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)

### Emergency Procedures
1. **Immediate Issues**: Disable workflow to stop processing
2. **Data Loss**: Restore from latest backup
3. **Security Breach**: Rotate all API keys immediately
4. **Performance Issues**: Scale resources or implement rate limiting

### Escalation Path
1. Check this troubleshooting guide
2. Review logs and error messages
3. Test individual components
4. Contact technical support with detailed error information
