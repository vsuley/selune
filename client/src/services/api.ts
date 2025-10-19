// API client for backend communication

const API_BASE_URL = import.meta.env["VITE_API_URL"] || "http://localhost:3001";

export interface CreateEventData {
  title: string;
  startTime: string; // ISO 8601 string (required)
  durationMinutes: number;
  parentEventId?: string | null;
  patternId?: string | null;
  periodKey?: string | null;
  category?: string;
  isFlexible?: boolean;
  isTimeBound?: boolean;
  deadline?: string | null; // ISO 8601 string
  notes?: string;
}

export interface Event {
  id: string;
  title: string;
  startTime: Date;
  durationMinutes: number;
  parentEventId: string | null;
  patternId: string | null;
  periodKey: string | null;
  category: string;
  isFlexible: boolean;
  isTimeBound: boolean;
  deadline: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualEvent {
  id: string;
  title: string;
  durationMinutes: number;
  patternId: string;
  periodKey: string;
  category: string;
  isFlexible: boolean;
  deadline: Date;
  notes: string;
}

export interface EventsResponse {
  events: Event[];
  virtualEvents: VirtualEvent[];
}

export interface UpdateEventData {
  title?: string;
  startTime?: string | null;
  durationMinutes?: number;
  category?: string;
  notes?: string;
}

export async function getEvents(
  start: Date,
  end: Date
): Promise<EventsResponse> {
  // Format as YYYY-MM-DDTHH:mm:ss in local timezone (avoid UTC conversion)
  const startISO = `${start.getFullYear()}-${String(
    start.getMonth() + 1
  ).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}T00:00:00`;
  const endISO = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(end.getDate()).padStart(2, "0")}T00:00:00`;

  const response = await fetch(
    `${API_BASE_URL}/api/events?start=${encodeURIComponent(
      startISO
    )}&end=${encodeURIComponent(endISO)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch events");
  }

  const data = await response.json();

  // Convert date strings to Date objects for events
  const events = data.events.map(
    (
      event: Event & {
        startTime: string;
        deadline?: string;
        createdAt: string;
        updatedAt: string;
      }
    ) => ({
      ...event,
      startTime: new Date(event.startTime),
      deadline: event.deadline ? new Date(event.deadline) : null,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    })
  );

  // Convert date strings to Date objects for virtual events
  const virtualEvents = data.virtualEvents.map(
    (virtualEvent: VirtualEvent & { deadline: string }) => ({
      ...virtualEvent,
      deadline: new Date(virtualEvent.deadline),
    })
  );

  return {
    events,
    virtualEvents,
  };
}

export async function updateEvent(
  id: string,
  data: UpdateEventData
): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update event");
  }

  const event = await response.json();

  // Convert date strings to Date objects
  return {
    ...event,
    startTime: new Date(event.startTime),
    deadline: event.deadline ? new Date(event.deadline) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  };
}

export async function createEvent(data: CreateEventData): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create event");
  }

  const event = await response.json();

  // Convert date strings to Date objects
  return {
    ...event,
    startTime: new Date(event.startTime),
    deadline: event.deadline ? new Date(event.deadline) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  };
}

// Pattern types
export type FrequencyType =
  | "weekly"
  | "monthly"
  | "yearly"
  | "every_n_days"
  | "n_per_period"
  | "nth_weekday_of_month";

// Example: 3rd Wednesday of every month
// Example: Last Saturday of every month
export interface NthWeekdayConfig {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  occurrence: 1 | 2 | 3 | 4 | -1; // -1=last
}

// Example: 22nd of August
export interface YearlyConfig {
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  day: number; // 1-31
}

// Example: Thanksgiving
// Example: Halloween
export interface YearlyNthWeekdayConfig {
  month: number; // 1-12
  weekday: number; // 0-6
  occurrence: number; // 1-4 or -1
}

export interface CreatePatternData {
  title: string;
  frequency: FrequencyType;
  frequencyValue: number;
  durationMinutes: number;
  nthWeekdayConfig?: NthWeekdayConfig;
  yearlyConfig?: YearlyConfig;
  yearlyNthWeekday?: YearlyNthWeekdayConfig;
  flexibleScheduling?: boolean;
}

export interface RecurrencePattern {
  id: string;
  title: string;
  frequency: string;
  frequencyValue: number;
  durationMinutes: number;
  nthWeekdayConfig: NthWeekdayConfig | null;
  yearlyConfig: YearlyConfig | null;
  yearlyNthWeekday: YearlyNthWeekdayConfig | null;
  flexibleScheduling: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pattern API functions
export async function getPatterns(): Promise<RecurrencePattern[]> {
  const response = await fetch(`${API_BASE_URL}/api/patterns?active=true`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch patterns");
  }

  const patterns = await response.json();

  // Convert date strings to Date objects
  return patterns.map(
    (
      pattern: RecurrencePattern & {
        createdAt: string;
        updatedAt: string;
      }
    ) => ({
      ...pattern,
      createdAt: new Date(pattern.createdAt),
      updatedAt: new Date(pattern.updatedAt),
    })
  );
}

export async function createPattern(
  data: CreatePatternData
): Promise<RecurrencePattern> {
  const response = await fetch(`${API_BASE_URL}/api/patterns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create pattern");
  }

  const pattern = await response.json();

  // Convert date strings to Date objects
  return {
    ...pattern,
    createdAt: new Date(pattern.createdAt),
    updatedAt: new Date(pattern.updatedAt),
  };
}

export async function generatePatternInstance(
  patternId: string,
  periodKey?: string
): Promise<Event> {
  const response = await fetch(
    `${API_BASE_URL}/api/patterns/${patternId}/generate-instance`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ periodKey }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate pattern instance");
  }

  const event = await response.json();

  // Convert date strings to Date objects
  return {
    ...event,
    startTime: new Date(event.startTime),
    deadline: event.deadline ? new Date(event.deadline) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  };
}
