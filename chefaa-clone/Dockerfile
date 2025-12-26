# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build:prod

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install pnpm and serve
RUN npm install -g pnpm@latest serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose port (Fly.io will map this)
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

# Start application
CMD ["serve", "-s", "dist", "-l", "8080"]
