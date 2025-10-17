# Recurrence Implementation Spec

**Status:** Database ready, zero implementation exists
**Last Updated:** 2025-10-16

---

## Key Design Decisions

**Removed `timePreferences` and `dayPreferences` fields** - Users schedule via drag-and-drop based on current context, not preset preferences.

**Added `flexibleScheduling` boolean** - Distinguishes between:
- `true` (default): Personal tasks (haircuts, chores) → generate in backlog with `startTime = null`
- `false`: Fixed events (game nights, community events) → auto-schedule to calculated date/time

**Migrations applied:**
- `20251017035937_remove_time_day_preferences`
- `20251017042224_add_flexible_scheduling`

**Docker fix:** Prisma mounts now writable (removed `:ro` from `docker-compose.yml` lines 58, 112)

---

## Core Concepts

### Period Keys
Pattern satisfaction tracking via period identifiers:
- Weekly: `"2025-W42"` (ISO week)
- Monthly: `"2025-10"` (year-month)
- Yearly: `"2025"` (year)

### Instance Generation
Patterns generate **unscheduled** events (backlog items), NOT scheduled calendar events. User drags from backlog to schedule.

---

## Implementation Order

### 1. Backend Pattern CRUD

**Create files:**
- `server/src/routes/patterns.ts`
- `server/src/services/periodKeyService.ts`

**Add types to:** `server/src/types/index.ts`

**Endpoints:**
```
GET    /api/patterns
POST   /api/patterns
PATCH  /api/patterns/:id
DELETE /api/patterns/:id (soft delete, set active=false)
POST   /api/patterns/:id/generate-instance
```

**Period key utilities:**
```typescript
getPeriodKey(date: Date, frequency: string): string
isPatternSatisfied(patternId: string, periodKey: string): Promise<boolean>
getPatternCompletionCount(patternId: string, periodKey: string): Promise<number>
```

**Use `date-fns`:** `getISOWeek()`, `getISOWeekYear()` for week calculations

### 2. Instance Generation

**In `server/src/services/recurrenceService.ts`:**

```typescript
async function generateInstanceForPeriod(
  pattern: RecurrencePattern,
  periodKey: string
): Promise<Event>
```

**Logic:**
1. Check if pattern satisfied for period (query events with patternId + periodKey)
2. If not, create event with:
   - `startTime`:
     - If `flexibleScheduling = true`: `null` (unscheduled, goes to backlog)
     - If `flexibleScheduling = false`: calculated date/time (auto-scheduled to calendar)
   - `isTimeBound = true` (appears in backlog if unscheduled)
   - `deadline` = period end date
   - `patternId` and `periodKey` set

**Calculate startTime for non-flexible patterns:**
- Use frequency + config fields (yearlyConfig, nthWeekdayConfig, etc.)
- Add default time (e.g., 7pm for game nights) - can be pattern field later

**Special case - "N per period":** Allow multiple events per period, check count < N

### 3. Frontend Hooks

**Create:** `client/src/hooks/usePatterns.ts` with React Query hooks
**Update:** `client/src/services/api.ts` with pattern API methods

### 4. Pattern UI

**Create:**
- `client/src/components/Patterns/PatternList.tsx`
- `client/src/components/Patterns/PatternForm.tsx`

**Features:** Create, list, edit (title/duration only), deactivate patterns

### 5. Backlog Integration

**Update:** Backlog components to show pattern-based events grouped by pattern with urgency indicators

---

## Edge Cases

1. **Leap year Feb 29** → Use Feb 28 on non-leap years
2. **Invalid dates** (Feb 30, Apr 31) → Validate at pattern creation
3. **ISO week boundaries** → Week starts Monday, first week = week with first Thursday
4. **"Last occurrence" nth weekday** → Find all occurrences, take last

---

## Critical Queries

**Check satisfaction:**
```sql
SELECT COUNT(*) FROM Event
WHERE patternId = ? AND periodKey = ?
```

**Get unsatisfied weekly patterns:**
```sql
SELECT p.* FROM RecurrencePattern p
WHERE p.active = true AND p.frequency = 'weekly'
AND NOT EXISTS (
  SELECT 1 FROM Event e
  WHERE e.patternId = p.id AND e.periodKey = ?
)
```

---

## Start Here

1. Create `server/src/routes/patterns.ts` with GET/POST/PATCH/DELETE
2. Add pattern types to `server/src/types/index.ts`
3. Create `server/src/services/periodKeyService.ts` for period key logic
4. Mount pattern routes in `server/src/server.ts`
5. Test with curl before building frontend
