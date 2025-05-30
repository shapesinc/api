# Use an official Node.js runtime as a base image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if you have one)
# to install dependencies first. This leverages Docker's layer caching.
COPY package*.json ./

# Install application dependencies
# The --production flag ensures only production dependencies are installed
RUN npm install --production

# Copy the rest of the application code into the working directory
# This includes app.js, state.js, messaging.js, shapesApiClient.js, utils.js, logger.js
COPY . .

# Expose the port the Node.js app will listen on
# Your script defaults to 8080, but is configurable via the PORT env var
EXPOSE 8080

# Define the command to run the application
# This executes your app.js script using node
CMD [ "node", "app.js" ]

# Note: Environment variables like SHAPES_API_KEY, TWILIO_*, SENDBLUE_*, REDIS_*, etc.
# should be provided to the Kubernetes Deployment, not baked into the image.
# The .env file is not copied into the image by this Dockerfile.
