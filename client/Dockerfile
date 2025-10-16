# Development stage
FROM node:20-alpine AS development

WORKDIR /app/client

# Copy client package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy client source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server (accessible from host)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM node:20-alpine AS builder

WORKDIR /app/client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
