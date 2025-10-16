# Development stage
FROM node:20-alpine AS development

# Install OpenSSL compatibility for Prisma
RUN apk add --no-cache openssl

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy server source
COPY server/ ./

# Expose server port
EXPOSE 3001

# Start in development mode with hot reload
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:20-alpine AS builder

# Install OpenSSL compatibility for Prisma
RUN apk add --no-cache openssl

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy server source
COPY server/ ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install OpenSSL compatibility for Prisma
RUN apk add --no-cache openssl

WORKDIR /app/server

# Copy dependencies and built files from builder
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/package*.json ./

# Expose server port
EXPOSE 3001

# Start production server
CMD ["node", "dist/server.js"]
