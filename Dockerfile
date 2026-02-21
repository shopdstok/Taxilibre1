# Use Node.js 20 as the base image
FROM node:20-slim AS builder

# Install build dependencies for native modules (like better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend assets
RUN npm run build

# Final production stage
FROM node:20-slim

# Install runtime dependencies if needed
WORKDIR /app

# Copy built application from the builder stage
COPY --from=builder /app ./

# Expose port 3000 (the only accessible port)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
