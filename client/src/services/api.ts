// API client for backend communication

const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:3001';

export interface CreateEventData {
  title: string;
  startTime: string | null; // ISO 8601 string or null for backlog
  durationMinutes: number;
  parentEventId?: string | null;
  category?: string;
  isTimeBound?: boolean;
  deadline?: string | null; // ISO 8601 string
  notes?: string;
}

export interface Event {
  id: string;
  title: string;
  startTime: Date | null;
  durationMinutes: number;
  parentEventId: string | null;
  patternId: string | null;
  periodKey: string | null;
  category: string;
  isTimeBound: boolean;
  deadline: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateEventData {
  title?: string;
  startTime?: string | null;
  durationMinutes?: number;
  category?: string;
  notes?: string;
}

export async function getEvents(start: Date, end: Date): Promise<Event[]> {
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const response = await fetch(
    `${API_BASE_URL}/api/events?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch events');
  }

  const events = await response.json();

  // Convert date strings to Date objects
  return events.map((event: any) => ({
    ...event,
    startTime: event.startTime ? new Date(event.startTime) : null,
    deadline: event.deadline ? new Date(event.deadline) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  }));
}

export async function updateEvent(id: string, data: UpdateEventData): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update event');
  }

  const event = await response.json();

  // Convert date strings to Date objects
  return {
    ...event,
    startTime: event.startTime ? new Date(event.startTime) : null,
    deadline: event.deadline ? new Date(event.deadline) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  };
}

export async function createEvent(data: CreateEventData): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create event');
  }

  const event = await response.json();

  // Convert date strings to Date objects
  return {
    ...event,
    startTime: event.startTime ? new Date(event.startTime) : null,
    deadline: event.deadline ? new Date(event.deadline) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  };
}
