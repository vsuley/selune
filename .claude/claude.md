# Personal Calendar & Time-Blocking App

## Project Overview
A progressive web app for personal life management with time-blocking, flexible recurring obligations, and hierarchical event organization. This is NOT a corporate calendar - it's designed for managing personal life with flexibility and realism.

**Core Philosophy**: Personal life is flexible. Obligations have satisfaction windows, not rigid schedules. Tasks like "clean cat filter weekly" or "haircut monthly" should be easy to schedule and track without corporate meeting rigidity.

## Tech Stack

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite** - Fast dev server, instant HMR
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client/UI state (sidebar collapsed, selected date, etc.)
- **dnd-kit** - Modern, accessible drag-and-drop
- **date-fns** - Date manipulation and formatting
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form handling for quick-add

### Backend
- **Node.js** + **Express**
- **Prisma ORM** - TypeScript-native database toolkit
- **PostgreSQL** - Primary database

### Development & Deployment
- **Docker** - All development and production deployments run in containers
- **Docker Compose** - Multi-container orchestration
- **Hot Reload** - Both client and server support hot reload in development
- **No Native Dependencies** - Everything runs in Docker, nothing installed on host

### Mobile/PWA
- Responsive design with mobile-specific views
- Touch-friendly interactions (44x44px minimum touch targets)
- PWA capabilities (optional: Workbox for offline support in Phase 2)

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types - use `unknown` if truly dynamic
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use const assertions where appropriate

### React
- Functional components only (no class components)
- Use hooks (useState, useEffect, useCallback, useMemo)
- Destructure props in function signatures
- Prefer named exports over default exports
- Keep components small and focused (< 200 lines)

### Code Style
- Use Prettier for formatting (auto-format on save)
- Use const for immutable values, let for mutable
- Descriptive variable names (no single letters except loop indices)
- Early returns to reduce nesting

### Component Structure
```typescript
// 1. Imports (React, types, hooks, components)
import { useState } from 'react';
import { Event } from '@/types';

// 2. Types/Interfaces
interface EventCardProps {
  event: Event;
  onUpdate: (event: Event) => void;
}

// 3. Component
export function EventCard({ event, onUpdate }: EventCardProps) {
  // hooks
  const [isEditing, setIsEditing] = useState(false);
  
  // handlers
  const handleClick = () => {
    setIsEditing(true);
  };
  
  // render
  return (
    <div onClick={handleClick}>
      {/* JSX */}
    </div>
  );
}
```

## File Organization

```
selune/
├── client/                            # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calendar/
│   │   │   │   ├── WeekView.tsx       # Desktop week grid
│   │   │   │   ├── DayView.tsx        # Mobile day view
│   │   │   │   ├── EventCard.tsx      # Individual event display
│   │   │   │   ├── ParentEventBlock.tsx  # Parent time block
│   │   │   │   └── TimeSlot.tsx       # Droppable time slot
│   │   │   ├── Backlog/
│   │   │   │   ├── BacklogSidebar.tsx # Collapsible sidebar
│   │   │   │   ├── TimeBoundList.tsx  # Time-bound obligations
│   │   │   │   ├── FloatingList.tsx   # Floating tasks
│   │   │   │   └── BacklogItem.tsx    # Draggable backlog item
│   │   │   ├── QuickAdd/
│   │   │   │   └── QuickAddModal.tsx  # Mobile quick-add
│   │   │   └── shared/
│   │   │       ├── DraggableEvent.tsx
│   │   │       └── Button.tsx
│   │   ├── hooks/
│   │   │   ├── useEvents.ts           # TanStack Query for events
│   │   │   ├── usePatterns.ts         # Recurring patterns
│   │   │   ├── useDragDrop.ts         # dnd-kit logic
│   │   │   └── useMetrics.ts          # Historical metrics
│   │   ├── services/
│   │   │   ├── api.ts                 # API client
│   │   │   └── recurrence.ts          # Recurrence calculations
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript types
│   │   ├── utils/
│   │   │   ├── dateHelpers.ts         # Date manipulation helpers
│   │   │   └── validation.ts          # Form validation
│   │   ├── stores/
│   │   │   └── uiStore.ts             # Zustand UI state
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile                     # Multi-stage Docker build (dev/prod)
│   ├── nginx.conf                     # Nginx config for production
│   ├── package.json                   # Frontend dependencies
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
├── server/                            # Backend Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── events.ts              # Event CRUD endpoints
│   │   │   ├── patterns.ts            # Pattern management
│   │   │   └── metrics.ts             # Historical metrics
│   │   ├── services/
│   │   │   ├── recurrenceService.ts   # Generate instances
│   │   │   └── metricsService.ts      # Calculate metrics
│   │   ├── types/
│   │   │   └── index.ts               # API type definitions
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   └── server.ts                  # Main Express server
│   ├── Dockerfile                     # Multi-stage Docker build (dev/prod)
│   ├── package.json                   # Backend dependencies
│   └── tsconfig.json
├── prisma/                            # Database schema (root level, shared)
│   ├── schema.prisma                  # Prisma schema
│   └── migrations/                    # Database migrations
├── .claude/
│   ├── CLAUDE.md                      # This file
│   └── commands/
│       ├── new-component.md
│       ├── new-api-endpoint.md
│       └── test-recurrence.md
├── docker-compose.yml                 # Development environment
├── docker-compose.prod.yml            # Production environment
├── package.json                       # Root package with Docker scripts
├── .env                               # Environment variables
├── .env.example                       # Example env file
└── README.md
```

## Data Model

### Core Types

```typescript
type RecurrencePattern = {
  id: string;
  title: string;
  frequency: 'weekly' | 'monthly' | 'yearly' | 'every_n_days' | 'n_per_period' | 'nth_weekday_of_month';
  frequencyValue: number;
  durationMinutes: number;
  timePreferences: {
    preferred: 'morning' | 'afternoon' | 'evening' | 'any';
    acceptable: ('morning' | 'afternoon' | 'evening')[];
  };
  dayPreferences: {
    preferred: ('weekday' | 'weekend')[];
    acceptable: 'any' | ('weekday' | 'weekend')[];
  };
  // For nth_weekday_of_month
  nthWeekdayConfig?: {
    weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=Sunday
    occurrence: 1 | 2 | 3 | 4 | -1;      // -1=last
  };
  // For yearly recurrence
  yearlyConfig?: {
    month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    day: number;  // 1-31
  };
  // For yearly on nth weekday (e.g., Thanksgiving)
  yearlyNthWeekday?: {
    month: number;
    weekday: number;
    occurrence: number;
  };
  active: boolean;
  createdAt: Date;
};

type Event = {
  id: string;
  title: string;
  startTime: Date | null;  // null = unscheduled (in backlog)
  durationMinutes: number;
  parentEventId: string | null;  // for child events
  patternId: string | null;      // if from recurring pattern
  periodKey: string | null;      // e.g., "2025-W42" or "2025-10"
  category: string;
  isTimeBound: boolean;          // true for time-bound backlog items
  deadline: Date | null;         // for time-bound items
  notes: string;
  createdAt: Date;
};

type HistoricalMetric = {
  patternId: string;
  totalCompletions: number;
  averageDaysBetween: number | null;
  lastCompleted: Date | null;
};
```

## Recurrence Patterns Supported

1. **Weekly** - Once per week (e.g., "Clean cat filter")
2. **Monthly** - Once per month on same day (e.g., "Pay rent on 1st")
3. **Yearly** - Once per year on specific date (e.g., "Birthday Oct 15")
4. **Yearly on nth weekday** - Once per year on nth weekday of month (e.g., "Thanksgiving: 4th Thu of Nov")
5. **Every N days** - Every N days (e.g., "Water plants every 3 days")
6. **N times per period** - N times per week (e.g., "Gym 3x per week")
7. **Nth weekday of month** - Specific weekday of month (e.g., "Haircut: 1st Sat of month, or last Sat of month")

### Edge Cases to Handle
- Leap year Feb 29 → default to Feb 28 on non-leap years
- Invalid dates (Feb 30, Month 31st) → validate at creation
- Timezone consistency → always use user's local timezone
- "Last occurrence" for months with varying week counts

## Parent-Child Event Behavior

- **One level of nesting only** - no grandchildren
- Parent can have empty time (children don't have to fill parent duration)
- Children cannot exceed parent bounds
- **CRITICAL: When parent is dragged, all children move with it, maintaining relative time offsets**
- When child is dragged, parent stays in place
- Visual feedback during parent drag to show children will move
- Children can be left unscheduled within parent (just associated, not positioned)

## Completion & Backlog System

### Completion Logic
- **Events in the past = automatically complete** (no explicit marking needed)
- User workflow: move undone items forward in time until they're done
- Keep completed items visible for satisfaction/awareness
- Historical metrics track completion patterns

### Backlog Sidebar
- **Collapsible** with badge showing count of time-bound items
- **Section 1: Time-Bound** - Events with deadlines or satisfaction windows
  - Shows urgency (e.g., "Due this week", "Due by Oct 20")
  - Visual alerts for approaching deadlines
  - Sorted by urgency
- **Section 2: Floating Tasks** - No time constraint
  - Inbox for ideas, someday/maybe items
  - Can be dragged to calendar when ready to schedule

### Drag Behavior
- Drag from backlog → calendar = schedule the item
- Drag from calendar → backlog = unschedule the item
- Drag within calendar = reschedule
- Drag parent event = move all children with relative offsets preserved

## UI/UX Principles

### Desktop (Primary Interface)
- Week view as main interface
- Time slots hourly (configurable granularity later)
- Drag-and-drop for all scheduling operations
- Backlog sidebar always accessible
- Clear visual distinction between:
  - Regular events
  - Parent blocks
  - Child events
  - Time-bound vs floating backlog items

### Mobile (Secondary Interface)
- Day view only (read-only display)
- Quick-add functionality (high priority)
  - Add to backlog (time-bound or floating)
  - Add directly to schedule
- Touch-friendly (minimum 44x44px touch targets)
- Swipe gestures for navigation between days

### Visual Design
- Clean, minimal interface
- Color-coding for categories
- Clear affordances for drag targets
- Optimistic UI updates (don't wait for server)
- Smooth animations (60fps target)

## API Endpoints

```
Events:
  GET    /api/events?start=2025-10-07&end=2025-10-13
  GET    /api/events/backlog
  POST   /api/events
  PATCH  /api/events/:id
  DELETE /api/events/:id

Recurring Patterns:
  GET    /api/patterns
  POST   /api/patterns
  PATCH  /api/patterns/:id
  DELETE /api/patterns/:id
  POST   /api/patterns/:id/generate-instance

Metrics:
  GET    /api/metrics/patterns/:id
```

## Testing Approach

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **Playwright** for E2E (later phase)
- Test file naming: `*.test.tsx` or `*.test.ts`
- Focus on critical paths:
  - Drag-and-drop operations
  - Recurrence calculations
  - Parent-child constraint validation
  - Date edge cases (leap years, month boundaries)

## Performance Targets

- Dev server start: < 1 second (Vite)
- Hot reload: < 100ms
- Calendar render: < 16ms (60fps)
- Drag operations: 60fps maintained
- API response: < 200ms
- Bundle size: < 500KB (initial load)

## Development Workflow

**IMPORTANT: All development happens in Docker containers. No native dependencies required on host machine.**

### First Time Setup

1. **Clone the repository**
2. **Create `.env` file** (copy from `.env.example`)
3. **Build and start containers:**
   ```bash
   npm run dev:build
   ```
4. **Run Prisma migrations:**
   ```bash
   npm run prisma:migrate
   ```

### Daily Development Workflow

**Start development environment:**
```bash
npm run dev
```

This command:
- Starts all containers (postgres, server, client)
- Follows logs for client and server
- Enables hot reload for both frontend and backend
- Accessible at:
  - Frontend: http://localhost:5173
  - Backend API: http://localhost:3001
  - Database: localhost:5432
  - pgAdmin: http://localhost:5050
  - Prisma Studio: http://localhost:5555 (if started)

**Other useful commands:**
```bash
npm run stop                    # Stop all containers
npm run start                   # Start stopped containers
npm run docker:restart          # Restart all containers
npm run docker:restart:server   # Restart only server
npm run docker:restart:client   # Restart only client
npm run docker:logs             # View all logs
npm run docker:logs:server      # View server logs only
npm run docker:logs:client      # View client logs only
npm run docker:down             # Stop and remove containers
npm run docker:clean            # Full cleanup (removes volumes)
```

**Prisma commands:**
```bash
npm run prisma:migrate          # Run migrations
npm run prisma:generate         # Generate Prisma client
npm run prisma:studio           # Open Prisma Studio at :5555
npm run prisma:studio:stop      # Stop Prisma Studio
```

### Production Deployment

```bash
npm run docker:prod:build       # Build production images
npm run docker:prod:up          # Start production containers
npm run docker:prod:logs        # View production logs
npm run docker:prod:down        # Stop production
```

### Project Phases

**Phase 1: Foundation** (Current)
1. ✓ Project scaffolding (Vite + Express + Prisma + Docker)
2. ✓ Database schema and migrations
3. ✓ Basic API endpoints (POST /api/events)
4. Week view layout
5. Basic event display

**Phase 2: Core Features**
6. Drag-and-drop implementation
7. Backlog sidebar
8. Recurrence pattern storage
9. Instance generation logic
10. Parent-child events

**Phase 3: Mobile & Polish**
11. Mobile day view
12. Quick-add modal
13. Historical metrics
14. Visual polish
15. Performance optimization

### Best Practices
- **All work in Docker** - Never install dependencies natively
- Use Plan Mode for complex architectural decisions
- Use `/clear` between distinct features to save tokens
- Commit working changes frequently
- Test on both desktop and mobile viewports
- Hot reload works automatically - just save files
- Use `docker:restart:server` or `docker:restart:client` if hot reload fails

## Known Constraints

- Must work well on mobile (touch-friendly interactions)
- Drag-and-drop must feel native/smooth (60fps target)
- Database queries must be efficient (indexed properly)
- Recurrence calculations must handle all edge cases
- Parent-child drag operations must be atomic (transaction-based)

## Current Phase

**Phase 1: Foundation** - Setting up core architecture and basic calendar view
- Database schema setup
- API endpoints for CRUD operations
- Basic calendar grid component
- Simple event creation
- Project structure and tooling

## Example Use Cases (for context)

1. **Weekly flexible obligation**: "Clean cat water filter - weekly, morning or evening"
2. **Monthly appointment**: "Haircut - first Saturday of every month"
3. **Time-blocked errands**: Parent "Saturday errands 2-5pm" with children "grocery", "pharmacy", "post office"
4. **Multiple per week**: "Gym - 3x per week, prefer Mon/Wed/Fri morning"
5. **Annual event**: "Birthday - October 15 every year"
6. **Floating task**: "Research new laptop" - no deadline, sits in backlog until scheduled

## Notes for Claude Code

- This is a solo personal project, not a corporate app
- Focus on flexibility and realistic personal scheduling
- User is an experienced programmer (CS masters 2006) - can handle technical details
- User will customize complex algorithms after initial generation
- Budget: ~$100 in API costs, so be efficient but thorough
- Prefer thoughtful, analytical responses that challenge assumptions
- If uncertain about something, ask for clarification rather than assume
