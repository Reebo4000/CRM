# ====== Stage 1: Build and prepare node_modules ======
FROM node:18-slim AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libcairo2-dev \
  libjpeg-dev \
  libpango1.0-dev \
  libgif-dev \
  libpixman-1-dev \
  libfreetype6-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy only package files to leverage caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production


# ====== Stage 2: Final image ======
FROM node:18-slim

WORKDIR /app

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  procps \
  libxss1 \
  libgconf-2-4 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libcairo-gobject2 \
  libgtk-3-0 \
  libgdk-pixbuf2.0-0 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrender1 \
  libxtst6 \
  libcups2 \
  libdrm2 \
  libxss1 \
  libgbm1 \
  libnss3 \
  libxrandr2 \
  libasound2 \
  libatspi2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libasound2 \
  && rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy actual app source code
COPY . .

# Ensure upload folder exists
RUN mkdir -p uploads

# Install Chrome for Puppeteer
RUN npx puppeteer browsers install chrome

# Drop to non-root user (optional, good practice)
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', res => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]
