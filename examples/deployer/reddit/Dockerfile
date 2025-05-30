FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy bot source code
COPY index.js ./

# Set environment variables (these will be overridden by Kubernetes secrets)
ENV SHAPESINC_API_KEY=""
ENV SHAPESINC_SHAPE_USERNAME=""
ENV REDDIT_CLIENT_ID=""
ENV REDDIT_CLIENT_SECRET=""
ENV REDDIT_USERNAME=""
ENV REDDIT_PASSWORD=""
ENV REDDIT_SUBREDDIT=""

# Create a volume for persistent data
VOLUME /app/data

# Run the bot
CMD ["node", "index.js"]