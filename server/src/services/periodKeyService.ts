import { getISOWeek, getISOWeekYear, getYear, getMonth, format } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import { FrequencyType } from '../types';

const prisma = new PrismaClient();

/**
 * Generate a period key for a given date and frequency type
 *
 * Period key formats:
 * - weekly: "2025-W42" (ISO week)
 * - monthly: "2025-10" (year-month)
 * - yearly: "2025" (year)
 * - every_n_days: Not period-based (uses completion tracking)
 * - n_per_period: "2025-W42" (weekly periods)
 * - nth_weekday_of_month: "2025-10" (monthly periods)
 */
export function getPeriodKey(date: Date, frequency: FrequencyType): string {
  switch (frequency) {
    case 'weekly':
      // ISO week format: YYYY-Www
      const isoWeek = getISOWeek(date);
      const isoYear = getISOWeekYear(date);
      return `${isoYear}-W${isoWeek.toString().padStart(2, '0')}`;

    case 'monthly':
    case 'nth_weekday_of_month':
      // Year-month format: YYYY-MM
      const year = getYear(date);
      const month = getMonth(date) + 1; // date-fns months are 0-indexed
      return `${year}-${month.toString().padStart(2, '0')}`;

    case 'yearly':
      // Year only: YYYY
      return getYear(date).toString();

    case 'n_per_period':
      // N per period uses weekly periods
      const nppWeek = getISOWeek(date);
      const nppYear = getISOWeekYear(date);
      return `${nppYear}-W${nppWeek.toString().padStart(2, '0')}`;

    case 'every_n_days':
      // every_n_days doesn't use period keys - it's based on last completion date
      throw new Error('every_n_days frequency does not use period keys');

    default:
      throw new Error(`Unknown frequency type: ${frequency}`);
  }
}

/**
 * Check if a pattern has been satisfied for a given period
 * Returns true if at least one event exists for this pattern+period
 */
export async function isPatternSatisfied(
  patternId: string,
  periodKey: string
): Promise<boolean> {
  const count = await prisma.event.count({
    where: {
      patternId,
      periodKey,
    },
  });

  return count > 0;
}

/**
 * Get the completion count for a pattern in a given period
 * Used for "N per period" patterns to check if N has been reached
 */
export async function getPatternCompletionCount(
  patternId: string,
  periodKey: string
): Promise<number> {
  return await prisma.event.count({
    where: {
      patternId,
      periodKey,
    },
  });
}

/**
 * Get end date for a period key
 * Used to calculate deadlines for time-bound backlog items
 */
export function getPeriodEndDate(periodKey: string, frequency: FrequencyType): Date {
  if (frequency === 'weekly' || frequency === 'n_per_period') {
    // Parse "2025-W42" format
    const [yearStr, weekStr] = periodKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);

    // Get first day of ISO week (Monday)
    const jan4 = new Date(year, 0, 4); // Jan 4 is always in week 1
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);

    // Add weeks
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);

    // End is Sunday at 23:59:59
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return weekEnd;
  } else if (frequency === 'monthly' || frequency === 'nth_weekday_of_month') {
    // Parse "2025-10" format
    const [yearStr, monthStr] = periodKey.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // Last day of month at 23:59:59
    const lastDay = new Date(year, month, 0); // month+0 gives last day of previous month
    lastDay.setHours(23, 59, 59, 999);

    return lastDay;
  } else if (frequency === 'yearly') {
    // Parse "2025" format
    const year = parseInt(periodKey);

    // Dec 31 at 23:59:59
    const lastDay = new Date(year, 11, 31);
    lastDay.setHours(23, 59, 59, 999);

    return lastDay;
  }

  throw new Error(`Cannot calculate period end for frequency: ${frequency}`);
}

/**
 * Get all unsatisfied patterns for a specific period
 * Useful for batch generation of instances
 */
export async function getUnsatisfiedPatterns(
  frequency: FrequencyType,
  periodKey: string
): Promise<any[]> {
  const patterns = await prisma.recurrencePattern.findMany({
    where: {
      active: true,
      frequency,
    },
  });

  const unsatisfied = [];
  for (const pattern of patterns) {
    const satisfied = await isPatternSatisfied(pattern.id, periodKey);
    if (!satisfied) {
      unsatisfied.push(pattern);
    }
  }

  return unsatisfied;
}
