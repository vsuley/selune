// Shared types for the API

export interface CreateEventRequest {
  title: string;
  startTime: string | null; // ISO 8601 string or null for backlog
  durationMinutes: number;
  parentEventId?: string | null;
  category?: string;
  isTimeBound?: boolean;
  deadline?: string | null; // ISO 8601 string
  notes?: string;
}

export interface UpdateEventRequest {
  title?: string;
  startTime?: string | null; // ISO 8601 string or null for backlog
  durationMinutes?: number;
  parentEventId?: string | null;
  category?: string;
  isTimeBound?: boolean;
  deadline?: string | null; // ISO 8601 string
  notes?: string;
}

export interface EventResponse {
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
