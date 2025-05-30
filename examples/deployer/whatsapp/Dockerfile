FROM node:20-slim

# Install Chromium and other required dependencies
# Removed ngrok dependencies like 'curl', 'gnupg', 'ca-certificates', 'jq' related to ngrok installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libgbm-dev \
    libatk-bridge2.0-0 \
    libfontconfig1 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxtst6 \
    libglib2.0-0 \
    libnspr4 \
    libexpat1 \
    libgconf-2-4 \
    libgtk-3-0 \
    libasound2 \
    libcurl4 \
    libdrm2 \
    libxkbcommon0 \
    libpangocairo-1.0-0 \
    libcups2 \
    libxcb1 \
    libxrender1 \
    libgdk-pixbuf2.0-0 \
    libjpeg-dev \
    libpng-dev \
    libwebp-dev \
    libtiff-dev \
    fontconfig \
    fonts-liberation \
    fonts-noto-color-emoji \
    unzip \
    wget \
    tini \
    && \
    rm -rf /var/lib/apt/lists/*

# Removed ngrok installation steps entirely

# Set working dir
WORKDIR /app

# Copy package files and install
COPY package*.json ./
# Ensure socket.io is in your package.json as a dependency
RUN npm install

# Copy app files
COPY . .

# Puppeteer config
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Add start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/start.sh"]