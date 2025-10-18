import { PrismaClient } from '@prisma/client';
import {
  addDays,
  addMonths,
  addYears,
  getDay,
  getDaysInMonth,
  setDate,
  setMonth,
  startOfMonth,
  endOfMonth,
  isLeapYear,
} from 'date-fns';
import {
  getPeriodKey,
  isPatternSatisfied,
  getPatternCompletionCount,
  getPeriodEndDate,
} from './periodKeyService';
import { FrequencyType, NthWeekdayConfig, YearlyConfig, YearlyNthWeekdayConfig } from '../types';

const prisma = new PrismaClient();

interface RecurrencePattern {
  id: string;
  title: string;
  frequency: string;
  frequencyValue: number;
  durationMinutes: number;
  nthWeekdayConfig: any;
  yearlyConfig: any;
  yearlyNthWeekday: any;
  flexibleScheduling: boolean;
  active: boolean;
}

/**
 * Generate an event instance for a pattern in a specific period
 * Returns the created event, or null if pattern is already satisfied
 */
export async function generateInstanceForPeriod(
  pattern: RecurrencePattern,
  periodKey: string,
  referenceDate: Date = new Date()
): Promise<any | null> {
  const frequency = pattern.frequency as FrequencyType;

  // Check if pattern already satisfied (unless it's n_per_period)
  if (frequency !== 'n_per_period') {
    const satisfied = await isPatternSatisfied(pattern.id, periodKey);
    if (satisfied) {
      return null; // Already satisfied
    }
  } else {
    // For n_per_period, check if we've reached the limit
    const count = await getPatternCompletionCount(pattern.id, periodKey);
    if (count >= pattern.frequencyValue) {
      return null; // Already reached N completions for this period
    }
  }

  // Calculate startTime based on flexibleScheduling
  let startTime: Date | null = null;

  if (!pattern.flexibleScheduling) {
    // Auto-schedule to calculated date/time
    startTime = calculateStartTime(pattern, referenceDate);
  }

  // Calculate deadline (period end date)
  const deadline = getPeriodEndDate(periodKey, frequency);

  // Create the event
  const event = await prisma.event.create({
    data: {
      title: pattern.title,
      startTime,
      durationMinutes: pattern.durationMinutes,
      patternId: pattern.id,
      periodKey,
      isTimeBound: true,
      deadline,
      category: 'recurring',
    },
  });

  return event;
}

/**
 * Calculate the scheduled start time for non-flexible patterns
 */
function calculateStartTime(pattern: RecurrencePattern, referenceDate: Date): Date {
  const frequency = pattern.frequency as FrequencyType;
  const defaultHour = 19; // 7 PM default for auto-scheduled events

  switch (frequency) {
    case 'weekly': {
      // Schedule for the reference date at default hour
      const scheduled = new Date(referenceDate);
      scheduled.setHours(defaultHour, 0, 0, 0);
      return scheduled;
    }

    case 'monthly': {
      // Schedule for same day of month
      const scheduled = new Date(referenceDate);
      scheduled.setHours(defaultHour, 0, 0, 0);
      return scheduled;
    }

    case 'yearly': {
      if (!pattern.yearlyConfig) {
        throw new Error('yearlyConfig required for yearly frequency');
      }

      const config = pattern.yearlyConfig as YearlyConfig;
      const year = referenceDate.getFullYear();

      // Handle leap year Feb 29 edge case
      let day = config.day;
      if (config.month === 2 && config.day === 29 && !isLeapYear(year)) {
        day = 28;
      }

      // Validate day is valid for month
      const daysInMonth = getDaysInMonth(new Date(year, config.month - 1));
      if (day > daysInMonth) {
        day = daysInMonth;
      }

      const scheduled = new Date(year, config.month - 1, day, defaultHour, 0, 0, 0);
      return scheduled;
    }

    case 'nth_weekday_of_month': {
      if (!pattern.nthWeekdayConfig) {
        throw new Error('nthWeekdayConfig required for nth_weekday_of_month frequency');
      }

      const config = pattern.nthWeekdayConfig as NthWeekdayConfig;
      const scheduled = calculateNthWeekdayOfMonth(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        config.weekday,
        config.occurrence
      );
      scheduled.setHours(defaultHour, 0, 0, 0);
      return scheduled;
    }

    case 'n_per_period': {
      // For n_per_period, schedule at reference date
      const scheduled = new Date(referenceDate);
      scheduled.setHours(defaultHour, 0, 0, 0);
      return scheduled;
    }

    case 'every_n_days': {
      // For every_n_days, schedule at reference date
      const scheduled = new Date(referenceDate);
      scheduled.setHours(defaultHour, 0, 0, 0);
      return scheduled;
    }

    default:
      throw new Error(`Unknown frequency type: ${frequency}`);
  }
}

/**
 * Calculate the nth occurrence of a weekday in a month
 * @param year - Year
 * @param month - Month (0-indexed, 0=January)
 * @param weekday - Day of week (0=Sunday, 6=Saturday)
 * @param occurrence - Which occurrence (1-4 or -1 for last)
 */
function calculateNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number
): Date {
  const firstDay = startOfMonth(new Date(year, month));
  const lastDay = endOfMonth(new Date(year, month));

  // Find all occurrences of the weekday in the month
  const occurrences: Date[] = [];
  let current = new Date(firstDay);

  while (current <= lastDay) {
    if (getDay(current) === weekday) {
      occurrences.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  if (occurrences.length === 0) {
    throw new Error(`No ${weekday} found in month ${month + 1} of year ${year}`);
  }

  // Get the nth occurrence
  if (occurrence === -1) {
    // Last occurrence
    return occurrences[occurrences.length - 1];
  } else if (occurrence > 0 && occurrence <= occurrences.length) {
    // 1st, 2nd, 3rd, 4th occurrence
    return occurrences[occurrence - 1];
  } else {
    throw new Error(
      `Invalid occurrence ${occurrence} for weekday ${weekday} in month ${month + 1}. Only ${occurrences.length} occurrences exist.`
    );
  }
}

/**
 * Generate instance for current period if needed
 * Convenience method that calculates current period key automatically
 */
export async function generateInstanceForCurrentPeriod(patternId: string): Promise<any | null> {
  const pattern = await prisma.recurrencePattern.findUnique({
    where: { id: patternId },
  });

  if (!pattern || !pattern.active) {
    return null;
  }

  const now = new Date();
  const frequency = pattern.frequency as FrequencyType;

  // every_n_days doesn't use period keys
  if (frequency === 'every_n_days') {
    throw new Error('every_n_days patterns require special handling (not period-based)');
  }

  const periodKey = getPeriodKey(now, frequency);

  return generateInstanceForPeriod(pattern as any, periodKey, now);
}

/**
 * Batch generate instances for all unsatisfied patterns of a specific frequency
 * Useful for periodic jobs (e.g., weekly cron to generate weekly patterns)
 */
export async function generateInstancesForFrequency(
  frequency: FrequencyType,
  referenceDate: Date = new Date()
): Promise<any[]> {
  if (frequency === 'every_n_days') {
    throw new Error('every_n_days patterns are not period-based');
  }

  const periodKey = getPeriodKey(referenceDate, frequency);

  const patterns = await prisma.recurrencePattern.findMany({
    where: {
      active: true,
      frequency,
    },
  });

  const createdEvents = [];

  for (const pattern of patterns) {
    try {
      const event = await generateInstanceForPeriod(pattern as any, periodKey, referenceDate);
      if (event) {
        createdEvents.push(event);
      }
    } catch (error) {
      console.error(`Failed to generate instance for pattern ${pattern.id}:`, error);
      // Continue with other patterns
    }
  }

  return createdEvents;
}

/**
 * Get the next suggested date for an every_n_days pattern
 * Based on last completion
 */
export async function getNextEveryNDaysDate(patternId: string): Promise<Date | null> {
  const pattern = await prisma.recurrencePattern.findUnique({
    where: { id: patternId },
  });

  if (!pattern || pattern.frequency !== 'every_n_days') {
    return null;
  }

  // Find most recent completed event (in the past)
  const lastEvent = await prisma.event.findFirst({
    where: {
      patternId,
      startTime: {
        not: null,
        lte: new Date(),
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  });

  if (!lastEvent || !lastEvent.startTime) {
    // No previous completion, suggest today
    return new Date();
  }

  // Add N days to last completion
  return addDays(lastEvent.startTime, pattern.frequencyValue);
}
