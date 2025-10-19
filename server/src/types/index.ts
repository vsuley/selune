// Shared types for the API

export interface CreateEventRequest {
  title: string;
  startTime: string; // ISO 8601 string (required)
  durationMinutes: number;
  parentEventId?: string | null;
  patternId?: string | null; // If scheduling a virtual event from a pattern
  periodKey?: string | null; // If scheduling a virtual event from a pattern
  category?: string;
  isFlexible?: boolean;
  isTimeBound?: boolean;
  deadline?: string | null; // ISO 8601 string
  notes?: string;
}

export interface UpdateEventRequest {
  title?: string;
  startTime?: string; // ISO 8601 string (required)
  durationMinutes?: number;
  parentEventId?: string | null;
  category?: string;
  isFlexible?: boolean;
  isTimeBound?: boolean;
  deadline?: string | null; // ISO 8601 string
  notes?: string;
}

export interface EventResponse {
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

export interface VirtualEventResponse {
  id: string; // Temporary ID (format: virtual-{patternId}-{periodKey})
  title: string;
  durationMinutes: number;
  patternId: string;
  periodKey: string;
  category: string;
  isFlexible: boolean;
  deadline: Date; // Period end date
  notes: string;
}

export interface EventsResponse {
  events: EventResponse[]; // Real scheduled events
  virtualEvents: VirtualEventResponse[]; // Unscheduled pattern instances
}

// Recurrence pattern types
export type FrequencyType =
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'every_n_days'
  | 'n_per_period'
  | 'nth_weekday_of_month';

export interface NthWeekdayConfig {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  occurrence: 1 | 2 | 3 | 4 | -1; // -1=last
}

export interface YearlyConfig {
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  day: number; // 1-31
}

export interface YearlyNthWeekdayConfig {
  month: number; // 1-12
  weekday: number; // 0-6
  occurrence: number; // 1-4 or -1
}

export interface CreatePatternRequest {
  title: string;
  frequency: FrequencyType;
  frequencyValue: number;
  durationMinutes: number;
  nthWeekdayConfig?: NthWeekdayConfig;
  yearlyConfig?: YearlyConfig;
  yearlyNthWeekday?: YearlyNthWeekdayConfig;
  flexibleScheduling?: boolean;
  startTime?: string; // ISO 8601 string - required when flexibleScheduling is false
}

export interface UpdatePatternRequest {
  title?: string;
  durationMinutes?: number;
  active?: boolean;
}

export interface PatternResponse {
  id: string;
  title: string;
  frequency: string;
  frequencyValue: number;
  durationMinutes: number;
  nthWeekdayConfig: NthWeekdayConfig | null;
  yearlyConfig: YearlyConfig | null;
  yearlyNthWeekday: YearlyNthWeekdayConfig | null;
  flexibleScheduling: boolean;
  startTime: Date | null; // null when flexibleScheduling is true
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateInstanceRequest {
  periodKey?: string; // Optional: if not provided, use current period
}
