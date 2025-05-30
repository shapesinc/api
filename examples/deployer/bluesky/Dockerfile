# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# This allows npm install to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (not strictly necessary for a background worker,
# but good practice if it had a web interface)
# EXPOSE 3000 # Remove or comment this out if your bot doesn't serve traffic

# Define environment variables - these will be provided by Kubernetes Secrets
# ENV BLUESKY_IDENTIFIER=
# ENV BLUESKY_PASSWORD=
# ENV SHAPESINC_API_KEY=
# ENV SHAPESINC_SHAPE_USERNAME=
# ENV POLLING_INTERVAL=60000 # Default value

# Run the command to start the bot
CMD [ "node", "bot.js" ]