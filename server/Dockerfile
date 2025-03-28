FROM node:18-alpine

WORKDIR /app

# Install netcat for health checks and PostgreSQL client for database verification
RUN apk add --no-cache netcat-openbsd postgresql-client redis

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the server code
COPY . .

# Create a directory for config files
RUN mkdir -p /app/config

# Make the entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# Expose the server port
EXPOSE 3002

# Set environment variables
ENV NODE_ENV=production
ENV NODE_CONFIG_ENV=docker

# Use the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start the server
CMD ["node", "server.js"]
