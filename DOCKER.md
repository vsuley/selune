# Docker Development Guide

This project uses Docker exclusively for all development and production deployments. No native dependencies need to be installed on your host machine except Docker itself.

## Prerequisites

- Docker Desktop (Mac/Windows) or Docker Engine (Linux)
- Docker Compose (included with Docker Desktop)

## Architecture

The application consists of 5 services in development:

1. **postgres** - PostgreSQL 16 database
2. **pgadmin** - Database management UI (optional)
3. **server** - Express API backend (Node.js with hot reload)
4. **client** - Vite React frontend (with hot reload)
5. **prisma-studio** - Database GUI (optional, on-demand)

## Quick Start

### First Time Setup

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Build and start all containers
npm run dev:build

# 3. Run database migrations
npm run prisma:migrate

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# pgAdmin: http://localhost:5050
```

### Daily Development

```bash
# Start all services and follow logs
npm run dev

# Or start in detached mode
npm run docker:up

# Stop all services
npm run stop
```

## Available Commands

### Development

```bash
npm run dev              # Start containers + follow logs
npm run dev:build        # Build images + start + follow logs
npm run stop             # Stop containers (don't remove)
npm run start            # Start stopped containers
npm run docker:down      # Stop and remove containers
npm run docker:clean     # Full cleanup (removes volumes/data!)
```

### Logs

```bash
npm run docker:logs              # All logs
npm run docker:logs:client       # Client logs only
npm run docker:logs:server       # Server logs only
```

### Restart Services

```bash
npm run docker:restart           # Restart all
npm run docker:restart:client    # Restart client only
npm run docker:restart:server    # Restart server only
```

### Prisma/Database

```bash
npm run prisma:migrate           # Run migrations
npm run prisma:generate          # Generate Prisma client
npm run prisma:studio            # Open Prisma Studio (:5555)
npm run prisma:studio:stop       # Stop Prisma Studio
```

### Production

```bash
npm run docker:prod:build        # Build production images
npm run docker:prod:up           # Start production environment
npm run docker:prod:logs         # View production logs
npm run docker:prod:down         # Stop production
```

## Port Mappings

| Service        | Container Port | Host Port | URL                          |
|----------------|----------------|-----------|------------------------------|
| Client (Vite)  | 5173          | 5173      | http://localhost:5173        |
| Server (API)   | 3001          | 3001      | http://localhost:3001        |
| PostgreSQL     | 5432          | 5432      | postgresql://localhost:5432  |
| pgAdmin        | 80            | 5050      | http://localhost:5050        |
| Prisma Studio  | 5555          | 5555      | http://localhost:5555        |

## Hot Reload

Both client and server support hot reload in development:

### Client (Vite)
- Edit any file in `client/src/`
- Changes appear instantly in browser
- Full HMR (Hot Module Replacement)

### Server (Express)
- Edit any file in `server/src/`
- Server automatically restarts
- Uses `tsx watch` for TypeScript compilation

If hot reload stops working:
```bash
npm run docker:restart:client    # For frontend issues
npm run docker:restart:server    # For backend issues
```

## Volume Mounts

Development containers mount source code for hot reload:

### Client
- `./client/src` → `/app/client/src`
- `./client/public` → `/app/client/public`
- Config files mounted individually

### Server
- `./server/src` → `/app/server/src`
- `./prisma` → `/app/prisma` (shared)
- `./node_modules/.prisma` → `/app/node_modules/.prisma`

### Persistent Data
- `postgres_data` - Database data (persists across restarts)
- `pgadmin_data` - pgAdmin settings

## Troubleshooting

### Containers won't start

```bash
# Check container status
docker ps -a

# View logs for specific service
docker logs selune-client
docker logs selune-server
docker logs selune-postgres

# Full rebuild
npm run docker:down
npm run docker:clean
npm run dev:build
```

### Port already in use

```bash
# Find process using port (Mac/Linux)
lsof -i :5173
lsof -i :3001

# Kill the process or change ports in docker-compose.yml
```

### Database connection issues

```bash
# Check postgres is healthy
docker ps

# Should show "healthy" status for postgres
# If not, check logs:
docker logs selune-postgres

# Reset database (WARNING: deletes all data)
npm run docker:clean
npm run dev:build
npm run prisma:migrate
```

### Prisma client out of sync

```bash
# Regenerate Prisma client
npm run prisma:generate

# Restart server
npm run docker:restart:server
```

### Changes not reflecting

```bash
# For client
npm run docker:restart:client

# For server
npm run docker:restart:server

# Nuclear option - rebuild everything
npm run docker:down
npm run dev:build
```

### Running commands inside containers

```bash
# Execute command in running container
docker exec -it selune-server sh
docker exec -it selune-client sh

# Install new npm package
docker exec -it selune-server npm install package-name
docker exec -it selune-client npm install package-name

# Then rebuild
npm run docker:restart:server  # or :client
```

## Development vs Production

### Development Mode
- Multi-stage builds target `development` stage
- Source code mounted as volumes
- Hot reload enabled
- `NODE_ENV=development`
- Includes dev dependencies

### Production Mode
- Multi-stage builds target `production` stage
- Optimized builds copied into containers
- No source code mounts
- `NODE_ENV=production`
- Only production dependencies
- Nginx serves static frontend
- Smaller image sizes

## Environment Variables

### Development (.env)
```bash
# Database
POSTGRES_USER=selune
POSTGRES_PASSWORD=selune_password
POSTGRES_DB=selune_db
DATABASE_URL=postgresql://selune:selune_password@postgres:5432/selune_db

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@selune.com
PGADMIN_DEFAULT_PASSWORD=admin

# Server
PORT=3001

# Client
VITE_API_URL=http://localhost:3001
```

### Production
- Use strong passwords
- Set proper `DATABASE_URL` with production credentials
- Configure `VITE_API_URL` to production API URL
- Never commit `.env` to version control

## Network

All services run on `selune-network` bridge network, allowing:
- Containers to communicate by service name (e.g., `http://server:3001`)
- Host to access via localhost
- Isolation from other Docker networks

## Best Practices

1. **Never install dependencies natively** - Always use Docker
2. **Use `npm run dev` for daily work** - Simplest workflow
3. **Commit often** - Containers are stateless (except volumes)
4. **Don't edit inside containers** - Edit on host, changes sync automatically
5. **Use `:clean` carefully** - It deletes all database data
6. **Check logs first** - Most issues show up in logs
7. **Restart services** - Often fixes stuck states

## Adding New Dependencies

### Client
```bash
# Add to client/package.json manually, then:
docker-compose build client
npm run docker:restart:client
```

### Server
```bash
# Add to server/package.json manually, then:
docker-compose build server
npm run docker:restart:server
```

Or use `docker exec`:
```bash
docker exec -it selune-client npm install package-name
docker exec -it selune-server npm install package-name
# Then commit the updated package.json and rebuild
```

## Cleaning Up

```bash
# Stop containers
npm run stop

# Stop and remove containers (keeps volumes)
npm run docker:down

# Remove everything including data (DANGER!)
npm run docker:clean

# Remove unused Docker resources
docker system prune -a
```
