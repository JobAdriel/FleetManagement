# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN npm install --no-audit --no-fund

# Copy source
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1000 nodejs && \
    adduser -D -u 1000 -G nodejs nodejs

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001 || exit 1

CMD ["serve", "-s", "dist", "-l", "3001"]
