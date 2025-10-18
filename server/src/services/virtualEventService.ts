import { PrismaClient } from '@prisma/client';
import { FrequencyType } from '../types';
import { getPeriodKey, getPeriodEndDate } from './periodKeyService';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Virtual event representation (not persisted in DB)
 * These are unscheduled pattern instances without a startTime
 */
export interface VirtualEvent {
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

/**
 * Generate virtual events for all unsatisfied patterns in a date range
 * These events are NOT persisted to the database
 */
export async function generateVirtualEventsForRange(
  startDate: Date,
  endDate: Date
): Promise<VirtualEvent[]> {
  // Get all active patterns
  const patterns = await prisma.recurrencePattern.findMany({
    where: {
      active: true,
    },
  });

  const virtualEvents: VirtualEvent[] = [];

  for (const pattern of patterns) {
    const frequency = pattern.frequency as FrequencyType;

    // Skip every_n_days for now (requires special handling based on last completion)
    if (frequency === 'every_n_days') {
      continue;
    }

    // Determine all periods that overlap with the date range
    const periods = getPeriodsInRange(startDate, endDate, frequency);

    for (const period of periods) {
      const periodKey = period.key;

      // Check if this pattern already has a scheduled event for this period
      const existingEvent = await prisma.event.findFirst({
        where: {
          patternId: pattern.id,
          periodKey,
        },
      });

      // If no existing event, create a virtual one
      if (!existingEvent) {
        // For n_per_period, check count
        if (frequency === 'n_per_period') {
          const count = await prisma.event.count({
            where: {
              patternId: pattern.id,
              periodKey,
            },
          });

          if (count >= pattern.frequencyValue) {
            continue; // Already satisfied
          }
        }

        // Generate virtual event
        const virtualEvent = createVirtualEvent(pattern, periodKey, frequency);
        virtualEvents.push(virtualEvent);
      }
    }
  }

  return virtualEvents;
}

/**
 * Create a virtual event object from a pattern
 * Virtual events do NOT have a startTime - they are unscheduled
 */
function createVirtualEvent(
  pattern: any,
  periodKey: string,
  frequency: FrequencyType
): VirtualEvent {
  // Calculate deadline (period end date)
  const deadline = getPeriodEndDate(periodKey, frequency);

  // Generate a temporary ID for the virtual event
  const virtualId = `virtual-${pattern.id}-${periodKey}`;

  return {
    id: virtualId,
    title: pattern.title,
    durationMinutes: pattern.durationMinutes,
    patternId: pattern.id,
    periodKey,
    category: 'recurring',
    isFlexible: pattern.flexibleScheduling,
    deadline,
    notes: '',
  };
}

/**
 * Get all period keys that overlap with a date range
 */
function getPeriodsInRange(
  startDate: Date,
  endDate: Date,
  frequency: FrequencyType
): Array<{ key: string; startDate: Date }> {
  const periods: Array<{ key: string; startDate: Date }> = [];

  switch (frequency) {
    case 'weekly':
    case 'n_per_period': {
      // Generate weekly periods
      let current = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(endDate, { weekStartsOn: 1 });

      while (current <= end) {
        const periodKey = getPeriodKey(current, frequency);
        periods.push({ key: periodKey, startDate: new Date(current) });
        current = new Date(current.setDate(current.getDate() + 7));
      }
      break;
    }

    case 'monthly':
    case 'nth_weekday_of_month': {
      // Generate monthly periods
      let current = startOfMonth(startDate);
      const end = endOfMonth(endDate);

      while (current <= end) {
        const periodKey = getPeriodKey(current, frequency);
        periods.push({ key: periodKey, startDate: new Date(current) });
        current = new Date(current.setMonth(current.getMonth() + 1));
      }
      break;
    }

    case 'yearly': {
      // Generate yearly periods
      let current = startOfYear(startDate);
      const end = endOfYear(endDate);

      while (current <= end) {
        const periodKey = getPeriodKey(current, frequency);
        periods.push({ key: periodKey, startDate: new Date(current) });
        current = new Date(current.setFullYear(current.getFullYear() + 1));
      }
      break;
    }

    default:
      // Unknown frequency
      break;
  }

  return periods;
}
