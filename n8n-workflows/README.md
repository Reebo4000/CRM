# Gemini CRM AI Customer Service Agent - N8N Workflow

## 🤖 Overview

This N8N workflow creates an intelligent Arabic-speaking customer service agent for Telegram that integrates with your Gemini CRM system. The agent can handle customer inquiries, provide product recommendations, and maintain conversation context.

## 🏗️ Workflow Architecture

### Core Components

1. **Telegram Integration Layer**
   - Telegram Trigger: Receives incoming messages
   - Message Processor: Extracts user context and message data
   - Response Sender: Delivers AI responses and product recommendations

2. **CRM Integration Layer**
   - Customer Lookup: Finds existing customers by phone/Telegram ID
   - Customer Creation: Automatically registers new customers
   - Product Retrieval: Fetches available products from CRM

3. **AI Agent Core**
   - AI Customer Service Agent: Arabic-speaking conversational AI
   - Response Processor: Formats AI output for Telegram delivery
   - Intent Recognition: Identifies customer needs and requests

4. **Product Recommendation Engine**
   - Recommendation Formatter: Prepares product suggestions
   - Interactive Buttons: Adds "Add to Cart" and "Details" buttons

## 🔧 Prerequisites

### 1. N8N Installation
- N8N instance (self-hosted or cloud)
- LangChain nodes package installed: `@n8n/n8n-nodes-langchain`

### 2. Telegram Bot Setup
1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Set up webhook URL in N8N

### 3. OpenAI API Access
- OpenAI API key for the AI agent
- Recommended model: GPT-4 or GPT-3.5-turbo

### 4. Gemini CRM API Access
- CRM running on `http://localhost:5000`
- Integration API key configured

## ⚙️ Configuration Steps

### Step 1: Environment Variables

Set these environment variables in your N8N instance:

```bash
# Gemini CRM Integration
GEMINI_CRM_API_KEY=your_integration_api_key_here
GEMINI_CRM_BASE_URL=http://localhost:5000/api

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### Step 2: Credentials Setup

Create these credentials in N8N:

1. **Telegram Bot API**
   - Name: `telegram-bot-credentials`
   - Access Token: Your Telegram bot token

2. **OpenAI API**
   - Name: `openai-credentials`
   - API Key: Your OpenAI API key

### Step 3: Import Workflow

1. Copy the workflow JSON from `gemini-crm-ai-agent-workflow.json`
2. Import into N8N via the UI
3. Activate the workflow

### Step 4: Configure Webhook

1. Get the webhook URL from the Telegram Trigger node
2. Set up the webhook with Telegram:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-n8n-instance.com/webhook/telegram-webhook-crm"}'
   ```

## 🎯 Features

### Arabic Language Support
- Native Arabic responses with Egyptian dialect
- Culturally appropriate greetings and expressions
- Professional yet friendly tone

### Customer Management
- Automatic customer lookup by phone or Telegram ID
- New customer registration
- Purchase history integration
- Personalized responses based on customer data

### Product Recommendations
- Intelligent product suggestions based on customer needs
- Real-time inventory checking
- Price display in Egyptian pounds
- Interactive buttons for actions

### Conversation Context
- Maintains conversation history
- Intent recognition (greeting, product inquiry, complaint, etc.)
- Context-aware responses
- Escalation to human support when needed

## 📱 Usage Examples

### Customer Greeting
**Customer**: "السلام عليكم"
**Bot**: "وعليكم السلام أهلاً وسهلاً بيك يا أستاذ أحمد! إزيك النهارده؟ أقدر أساعدك في إيه؟"

### Product Inquiry
**Customer**: "عايز شنطة حريمي"
**Bot**: "أكيد يا أستاذ أحمد! عندنا مجموعة حلوة من الشنط الحريمي. دي أحسن الاختيارات ليك:"
- Product recommendations with images and prices
- Interactive buttons for adding to cart

### Order Status
**Customer**: "فين طلبي؟"
**Bot**: "خليني أشوف طلبك يا أستاذ أحمد... طلبك رقم #1234 في مرحلة التجهيز ومتوقع يوصلك بكرة إن شاء الله."

## 🔍 Monitoring & Analytics

### Conversation Tracking
- All conversations are logged
- Intent analysis for business insights
- Customer satisfaction metrics
- Response time monitoring

### Error Handling
- Graceful fallbacks for API failures
- Human escalation for complex issues
- Retry mechanisms for temporary failures
- Comprehensive error logging

## 🛠️ Customization

### Modifying AI Prompts
Edit the AI agent prompt in the workflow to:
- Change the personality or tone
- Add new product categories
- Modify response templates
- Include additional business rules

### Adding New Features
- Order creation directly from chat
- Payment processing integration
- Shipping tracking
- Customer feedback collection

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Credentials properly set up
- [ ] Webhook URL configured with Telegram
- [ ] CRM API connectivity tested
- [ ] OpenAI API limits configured
- [ ] Error monitoring enabled
- [ ] Backup and recovery procedures in place

### Performance Optimization
- Configure appropriate rate limits
- Set up caching for product data
- Monitor API usage and costs
- Implement conversation cleanup

## 📞 Support

For technical support or customization requests:
- Check N8N logs for error details
- Verify CRM API connectivity
- Test Telegram webhook configuration
- Review OpenAI API usage and limits

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor conversation quality
- Update product information
- Review and improve AI prompts
- Analyze customer feedback
- Update security credentials

### Version Control
- Keep workflow JSON backed up
- Document any customizations
- Test changes in development environment
- Maintain rollback procedures
