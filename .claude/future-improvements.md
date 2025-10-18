# Future Improvements & Optimizations

This document catalogs potential enhancements to the Selune calendar system. These are not immediate priorities but represent thoughtful optimizations for future phases.

---

## 1. Virtual Events Cache (Frontend Optimization)

**Problem**: As implemented, calling `/api/patterns/:id/generate-instance` creates DB rows for unscheduled events (`startTime=null`). While not a performance issue (patterns typically number in dozens, not thousands), we can optimize the frontend UX.

**Proposal**: Client-side virtual event generation

### Architecture

```
┌─────────────────────────────────────────────────┐
│ User Opens Calendar View                        │
├─────────────────────────────────────────────────┤
│ 1. Fetch active patterns                        │
│    GET /api/patterns?active=true                │
│                                                  │
│ 2. Compute visible date range                   │
│    Example: Current week ± 2 weeks buffer       │
│                                                  │
│ 3. Generate virtual events in-memory            │
│    For each pattern:                            │
│    • Calculate relevant period keys in range    │
│    • Check if period satisfied in DB            │
│    • Create virtual event object if missing     │
│                                                  │
│ 4. Store in client-side cache                   │
│    Options:                                     │
│    • React Query cache                          │
│    • IndexedDB for persistence                  │
│    • Zustand store for session state            │
└─────────────────────────────────────────────────┘
```

### Cache Invalidation Triggers

- **Pattern Changes**: Any CRUD operation on patterns table
- **Event Creation**: When virtual event is dragged to calendar (becomes real)
- **Date Range Change**: User navigates to significantly different time period
- **Time-based**: Automatic refresh at period boundaries (week rollover, month change)

### Benefits

- **Reduced DB Writes**: Only committed events create DB rows
- **Cleaner Backlog**: Database reflects actual user commitments
- **Better Performance**: Client-side computation faster than server round-trip
- **Offline Capability**: Can generate virtual events without network

### Implementation Notes

```typescript
// Example client-side service
class VirtualEventGenerator {
  generateForDateRange(
    patterns: Pattern[],
    existingEvents: Event[],
    startDate: Date,
    endDate: Date
  ): VirtualEvent[] {
    const virtualEvents: VirtualEvent[] = [];

    for (const pattern of patterns.filter(p => p.active)) {
      const periodKeys = this.getPeriodKeysInRange(
        pattern.frequency,
        startDate,
        endDate
      );

      for (const periodKey of periodKeys) {
        // Check if already satisfied
        const exists = existingEvents.some(
          e => e.patternId === pattern.id && e.periodKey === periodKey
        );

        if (!exists) {
          virtualEvents.push({
            ...this.createFromPattern(pattern, periodKey),
            isVirtual: true, // Flag for UI handling
          });
        }
      }
    }

    return virtualEvents;
  }
}
```

### When to Implement

- **Phase 2+**: After core calendar UI is functional
- **Trigger**: User feedback about backlog clutter
- **Prerequisite**: Stable pattern generation logic

---

## 2. Batch Period Generation

**Current Behavior**: Instances generated on-demand via API calls

**Enhancement**: Optional automated background generation

### Use Cases

1. **Pre-populated Backlog**: User opens app Monday morning, sees week's obligations ready
2. **Notification System**: "You have 5 unscheduled tasks this week"
3. **Planning Workflows**: Review upcoming week on Sunday evening

### Implementation Options

#### Option A: Server-Side Cron
```bash
# Weekly job (Sundays at midnight)
0 0 * * 0 curl -X POST /api/patterns/batch-generate?frequency=weekly

# Monthly job (1st of month)
0 0 1 * * curl -X POST /api/patterns/batch-generate?frequency=monthly
```

#### Option B: Client-Triggered
```typescript
// User opens calendar, trigger background generation
useEffect(() => {
  const lastGenerated = localStorage.getItem('lastBatchGenerated');
  const weekStart = startOfWeek(new Date());

  if (!lastGenerated || new Date(lastGenerated) < weekStart) {
    api.patterns.batchGenerate('weekly');
    localStorage.setItem('lastBatchGenerated', weekStart.toISOString());
  }
}, [currentWeek]);
```

#### Option C: Hybrid (Recommended)
- Server cron for regular users (set-it-and-forget-it)
- Client-side fallback if user hasn't opened app
- Idempotent: Re-running doesn't create duplicates (period key prevents this)

### Configuration

```typescript
// Per-user settings (future)
interface UserPreferences {
  autoGeneratePatterns: boolean;
  generateAheadWeeks: number; // How far in advance to generate
  notifyUnscheduledItems: boolean;
}
```

---

## 3. Annual Pattern Optimization

**Observation**: Yearly patterns are sparse but accumulate over decades

### Current Behavior
```
Birthday (Oct 15) pattern created in 2025
→ One event per year: 2025, 2026, 2027...
→ By 2045: 20 events in DB (only 1 relevant per year)
```

### Optimization Strategies

#### A. Lazy Generation
```typescript
// Only generate when year is viewed
if (viewedYear > lastGeneratedYear) {
  generateYearlyInstances(viewedYear);
}
```

#### B. Archive Old Years
```sql
-- Move completed events older than 2 years to archive table
INSERT INTO EventArchive
SELECT * FROM Event
WHERE startTime < NOW() - INTERVAL '2 years'
  AND startTime IS NOT NULL;

DELETE FROM Event
WHERE startTime < NOW() - INTERVAL '2 years';
```

#### C. On-Demand Generation with Cache
```typescript
// Generate yearly events for visible range only
const visibleYears = [currentYear - 1, currentYear, currentYear + 1];
const instances = generateYearlyInstances(pattern, visibleYears);
```

### When Needed
- Not urgent (even 50 years = 50 events per pattern)
- Consider when DB size becomes concern (millions of events)
- Useful for "life calendar" view (decade+ timescales)

---

## 4. Pattern Analytics

**Goal**: Surface insights about user's completion patterns

### Metrics to Track

#### Completion Rate
```sql
-- How often does user actually complete pattern instances?
SELECT
  p.title,
  COUNT(e.id) as total_instances,
  COUNT(CASE WHEN e.startTime IS NOT NULL THEN 1 END) as scheduled,
  COUNT(CASE WHEN e.startTime < NOW() THEN 1 END) as completed,
  (COUNT(CASE WHEN e.startTime < NOW() THEN 1 END)::float /
   COUNT(e.id)) * 100 as completion_percentage
FROM RecurrencePattern p
LEFT JOIN Event e ON e.patternId = p.id
GROUP BY p.id;
```

#### Average Delay from Deadline
```sql
-- How close to deadline does user typically schedule?
SELECT
  p.title,
  AVG(EXTRACT(EPOCH FROM (e.deadline - e.startTime)) / 3600) as avg_hours_before_deadline
FROM Event e
JOIN RecurrencePattern p ON p.id = e.patternId
WHERE e.startTime IS NOT NULL AND e.startTime < e.deadline
GROUP BY p.id;
```

#### Suggested Reschedule Times
```sql
-- Learn user's preferred days/times for each pattern
SELECT
  p.title,
  EXTRACT(DOW FROM e.startTime) as preferred_day_of_week,
  EXTRACT(HOUR FROM e.startTime) as preferred_hour,
  COUNT(*) as frequency
FROM Event e
JOIN RecurrencePattern p ON p.id = e.patternId
WHERE e.startTime IS NOT NULL
GROUP BY p.id, preferred_day_of_week, preferred_hour
ORDER BY p.id, frequency DESC;
```

### UI Visualizations

1. **Pattern Health Dashboard**
   - Green: >80% completion
   - Yellow: 50-80% completion
   - Red: <50% completion (maybe too ambitious?)

2. **Smart Scheduling Suggestions**
   - "You usually do 'Gym workout' on Tuesday evenings"
   - "Your 'Haircut' is due - you typically go on first Saturday"

3. **Trend Charts**
   - Weekly completion heatmap
   - Month-over-month pattern adherence
   - Time-of-day preference distribution

### Privacy Considerations
- All analytics client-side or user-scoped
- No cross-user aggregation
- User can disable analytics entirely

---

## 5. Additional Ideas (Unsorted)

### Pattern Templates
Pre-defined patterns for common use cases:
- "Weekly chores" → 7 common household tasks
- "Fitness routine" → Gym 3x/week + Yoga 2x/week
- "Self-care Sunday" → Monthly self-care block

### Pattern Scheduling Constraints
```typescript
interface PatternConstraints {
  preferredDays?: number[];      // [1, 3, 5] = Mon/Wed/Fri only
  preferredTimeRange?: {         // Only schedule between 6-9pm
    startHour: number;
    endHour: number;
  };
  avoidPatterns?: string[];      // Don't schedule same day as pattern X
  minimumGapHours?: number;      // At least N hours from other events
}
```

### Pattern Dependencies
"Can only do grocery shopping after paycheck clears"
```typescript
interface Pattern {
  dependsOn?: {
    patternId: string;
    offsetDays: number;  // Schedule N days after dependency
  };
}
```

### Seasonal Patterns
"Pool maintenance: May-September only"
```typescript
interface Pattern {
  activeMonths?: number[];  // [5,6,7,8,9] for May-Sept
}
```

### Pattern Rollover
"If I don't do laundry this week, allow 2x next week"
```typescript
interface Pattern {
  allowRollover: boolean;
  maxRolloverInstances: number;
}
```

---

## Implementation Priority

**Now (Phase 1)**
- ✅ Core pattern CRUD (implemented)
- ✅ Basic instance generation (implemented)

**Next (Phase 2)**
- Virtual events cache (if backlog feels cluttered)
- Basic completion analytics (quick wins)

**Later (Phase 3+)**
- Batch generation (user demand-driven)
- Smart scheduling suggestions
- Advanced constraint system

**Future (Phase 4+)**
- Pattern templates
- Seasonal patterns
- Rollover logic
- Archive system

---

## Notes for Implementation

- **Keep it simple**: Don't implement until user need is clear
- **Data-driven**: Use actual usage patterns to inform priorities
- **Incremental**: Small, testable improvements over big rewrites
- **User control**: All smart features should have manual override

---

**Last Updated**: 2025-10-17
**Maintained by**: Core development team
**Status**: Living document - add ideas as they arise
