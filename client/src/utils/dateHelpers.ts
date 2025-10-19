import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  startOfDay,
  addMinutes,
  differenceInMinutes,
  parseISO,
} from "date-fns";

/**
 * ISO 8601 standard: weeks start on Monday
 */
const ISO_WEEK_START = 1;

/**
 * Height of the day column header in pixels
 * This is used to offset the TimeGrid and event positioning
 */
export const DAY_HEADER_HEIGHT = 31;

/**
 * Get the start of the week for a given date (ISO standard: Monday)
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: ISO_WEEK_START });
}

/**
 * Get the end of the week for a given date (ISO standard: Sunday)
 */
export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: ISO_WEEK_START });
}

/**
 * Get all days in the week for a given date (Mon-Sun)
 */
export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return eachDayOfInterval({ start, end });
}

/**
 * Navigate to the next week
 */
export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

/**
 * Navigate to the previous week
 */
export function getPreviousWeek(date: Date): Date {
  return subWeeks(date, 1);
}

/**
 * Format a date for display in the calendar header
 */
export function formatDayHeader(date: Date): string {
  return format(date, "EEE d");
}

/**
 * Format a date range for the week header
 */
export function formatWeekRange(start: Date, end: Date): string {
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get all hours in a day (0-23)
 */
export function getHoursInDay(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Format hour for time labels (e.g., "9 AM", "2 PM")
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Get the pixel position for a given time within a day
 * Assumes 60px per hour
 */
export function getTimePosition(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return hours * 60 + minutes; // 1px per minute
}

/**
 * Get the date/time from a pixel position in the grid
 */
export function getDateFromPosition(day: Date, pixelY: number): Date {
  const totalMinutes = pixelY; // 1px = 1 minute
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const result = startOfDay(day);
  return addMinutes(result, hours * 60 + minutes);
}

/**
 * Snap time to the nearest 15-minute increment
 */
export function snapToQuarterHour(date: Date): Date {
  const minutes = date.getMinutes();
  const snappedMinutes = Math.round(minutes / 15) * 15;
  const result = new Date(date);
  result.setMinutes(snappedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

/**
 * Get the height in pixels for a duration in minutes
 */
export function getDurationHeight(durationMinutes: number): number {
  return durationMinutes; // 1px per minute
}

/**
 * Calculate the duration between two times
 */
export function getMinutesBetween(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

/**
 * Parse ISO string to Date, handling null
 */
export function parseISOSafe(dateString: string | null): Date | null {
  if (!dateString) return null;
  try {
    return parseISO(dateString);
  } catch {
    return null;
  }
}

/**
 * Get the current week's date range (ISO standard: Mon-Sun)
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: getWeekStart(now),
    end: getWeekEnd(now),
  };
}

/**
 * Check if two dates are in the same week (ISO standard)
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  const start1 = getWeekStart(date1);
  const start2 = getWeekStart(date2);
  return isSameDay(start1, start2);
}

/**
 * Get day of week index (0-6)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get the column index for a date in the week view
 */
export function getColumnIndex(date: Date, weekStart: Date): number {
  const daysDiff =
    differenceInMinutes(startOfDay(date), startOfDay(weekStart)) / (24 * 60);
  return Math.floor(daysDiff);
}

/**
 * Check if an event is in the past (end time has passed)
 */
export function isPastEvent(startTime: Date, durationMinutes: number): boolean {
  const endTime = addMinutes(startTime, durationMinutes);
  return endTime < new Date();
}
