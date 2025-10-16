# Project Structure

This project is organized into separate `client/` and `server/` directories for clear separation of concerns.

## Directory Layout

```
selune/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── EventForm.tsx
│   │   ├── services/       # API client functions
│   │   │   └── api.ts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/             # Static assets
│   ├── package.json        # Client dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript config
│   └── eslint.config.js    # ESLint config
│
├── server/                 # Backend Express API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   │   └── events.ts   # Event endpoints
│   │   ├── types/          # TypeScript type definitions
│   │   │   └── index.ts
│   │   └── server.ts       # Main server file
│   ├── package.json        # Server dependencies
│   ├── tsconfig.json       # TypeScript config
│   └── prisma-client.ts    # Prisma client wrapper
│
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Prisma schema definition
│
├── node_modules/           # Shared dependencies (Prisma)
├── package.json            # Root package.json with scripts
├── .env                    # Environment variables
└── .env.example            # Example environment variables
```

## NPM Scripts

### Root Level (run from project root)

- `npm run install:all` - Install all dependencies (root, client, server)
- `npm run dev` - Run both client and server in parallel
- `npm run dev:client` - Run only the frontend dev server
- `npm run dev:server` - Run only the backend API server
- `npm run build` - Build both client and server
- `npm run build:client` - Build only the frontend
- `npm run build:server` - Build only the backend
- `npm run prisma:migrate` - Run Prisma migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio

### Client Scripts (run from client/ directory)

- `npm run dev` - Start Vite dev server (default: http://localhost:5173)
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Server Scripts (run from server/ directory)

- `npm run dev` - Start Express server with hot reload (default: http://localhost:3001)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled server

## Development Workflow

### First Time Setup

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

3. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

### Daily Development

Run both client and server concurrently:
```bash
npm run dev
```

Or run them separately in different terminals:
```bash
# Terminal 1
npm run dev:client

# Terminal 2
npm run dev:server
```

## API Endpoints

- **POST** `/api/events` - Create a new event

## Environment Variables

Configure in `.env` file:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `VITE_API_URL` - API URL for frontend (default: http://localhost:3001)

## Key Files

- `client/src/services/api.ts` - API client functions for frontend
- `server/src/routes/events.ts` - Event API endpoints
- `server/src/types/index.ts` - Shared TypeScript types for API
- `prisma/schema.prisma` - Database schema
