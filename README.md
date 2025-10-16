# Selune - Personal Calendar & Time-Blocking App

A progressive web app for personal life management with time-blocking, flexible recurring obligations, and hierarchical event organization.

**Core Philosophy**: Personal life is flexible. Obligations have satisfaction windows, not rigid schedules. This is NOT a corporate calendar - it's designed for managing personal life with flexibility and realism.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Development**: Docker + Docker Compose (100% containerized)
- **Production**: Docker with multi-stage builds

## Prerequisites

**Only Docker is required** - no native dependencies needed!

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Mac/Windows)
- Or Docker Engine + Docker Compose (Linux)

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd selune

# 2. Copy environment variables
cp .env.example .env

# 3. Build and start all containers
npm run dev:build

# 4. Run database migrations
npm run prisma:migrate

# 5. Open your browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# pgAdmin: http://localhost:5050
```

## Development Workflow

### Daily Development

```bash
# Start all services and watch logs
npm run dev

# Access the application
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3001
# - Database: localhost:5432
# - pgAdmin: http://localhost:5050
# - Prisma Studio: http://localhost:5555 (when started)
```

Hot reload works automatically for both frontend and backend - just edit files and save!

### Common Commands

```bash
# Container management
npm run stop                    # Stop all containers
npm run start                   # Start stopped containers
npm run docker:restart          # Restart all containers
npm run docker:down             # Stop and remove containers
npm run docker:clean            # Full cleanup (removes data!)

# Logs
npm run docker:logs             # All logs
npm run docker:logs:client      # Client logs only
npm run docker:logs:server      # Server logs only

# Database/Prisma
npm run prisma:migrate          # Run migrations
npm run prisma:generate         # Generate Prisma client
npm run prisma:studio           # Open Prisma Studio
```

See [DOCKER.md](./DOCKER.md) for complete Docker documentation.

## Project Structure

```
selune/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API client
│   │   ├── hooks/              # Custom hooks
│   │   └── ...
│   ├── Dockerfile              # Multi-stage build
│   └── package.json
├── server/                     # Backend Express API
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── types/              # TypeScript types
│   │   └── server.ts
│   ├── Dockerfile              # Multi-stage build
│   └── package.json
├── prisma/                     # Database schema
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
└── package.json                # Root scripts
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure.

## Features

### Current (Phase 1)
- ✅ Docker-based development environment
- ✅ PostgreSQL database with Prisma ORM
- ✅ Express API backend with hot reload
- ✅ React + Vite frontend with hot reload
- ✅ Event creation API endpoint
- ✅ Event creation form

### Planned (Phase 2)
- Drag-and-drop scheduling
- Backlog sidebar (time-bound vs floating tasks)
- Recurring pattern management
- Parent-child event relationships

### Planned (Phase 3)
- Mobile-responsive views
- Historical metrics
- Performance optimizations
- PWA capabilities

## API Endpoints

### Events
- `POST /api/events` - Create a new event

### Planned
- `GET /api/events?start=<date>&end=<date>` - List events
- `GET /api/events/backlog` - Get backlog items
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## Database Access

### pgAdmin (Recommended)

1. Go to http://localhost:5050
2. Login with credentials from `.env`:
   - Email: `admin@selune.com`
   - Password: `admin`
3. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `selune_db`
   - Username: `selune`
   - Password: `selune_password`

### Prisma Studio

```bash
npm run prisma:studio
```

Open http://localhost:5555 to browse and edit data.

### Command Line

```bash
psql -h localhost -p 5432 -U selune -d selune_db
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
POSTGRES_USER=selune
POSTGRES_PASSWORD=selune_password  # CHANGE IN PRODUCTION!
POSTGRES_DB=selune_db
DATABASE_URL=postgresql://selune:selune_password@postgres:5432/selune_db

# Server
PORT=3001

# Client
VITE_API_URL=http://localhost:3001
```

## Production Deployment

```bash
# Build production images
npm run docker:prod:build

# Start production environment
npm run docker:prod:up

# View logs
npm run docker:prod:logs

# Stop
npm run docker:prod:down
```

Production environment:
- Client served by Nginx on port 80
- Server runs optimized Node.js build
- Smaller Docker images
- No dev dependencies

## Troubleshooting

### Containers won't start
```bash
docker ps -a                    # Check status
docker logs selune-client       # View logs
docker logs selune-server
npm run docker:clean            # Nuclear option (deletes data!)
npm run dev:build               # Rebuild
```

### Hot reload not working
```bash
npm run docker:restart:client   # Restart frontend
npm run docker:restart:server   # Restart backend
```

### Database issues
```bash
docker logs selune-postgres     # Check database logs
npm run prisma:migrate          # Run migrations
npm run prisma:generate         # Regenerate client
```

### Port conflicts
```bash
# Check what's using the port
lsof -i :5173
lsof -i :3001

# Kill process or change ports in docker-compose.yml
```

See [DOCKER.md](./DOCKER.md) for detailed troubleshooting.

## Development Best Practices

- **All work in Docker** - Never install dependencies natively
- **Hot reload** - Just save files, changes appear automatically
- **Commit often** - Containers are stateless
- **Check logs** - Most issues show up in logs
- **Use restart commands** - Often fixes stuck states

## Documentation

- [DOCKER.md](./DOCKER.md) - Complete Docker guide
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Project organization
- [.claude/CLAUDE.md](./.claude/CLAUDE.md) - Development guidelines

## License

All rights reserved.
