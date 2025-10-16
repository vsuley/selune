---
name: test-recurrence
description: Create comprehensive tests for recurrence pattern calculations
---

Create tests for recurrence pattern: $ARGUMENTS

Requirements:
1. **Test all pattern types**
   - Weekly
   - Monthly
   - Yearly (both fixed date and nth weekday)
   - Every N days
   - N times per period
   - Nth weekday of month

2. **Edge cases to cover**
   - Leap years (Feb 29)
   - Invalid dates (Feb 30, Month 31st for short months)
   - Month boundaries
   - Year boundaries
   - Last occurrence of weekday in month (4 vs 5 weeks)
   - Timezone handling

3. **Test structure**
   - Use Vitest
   - Clear test descriptions
   - Arrange-Act-Assert pattern
   - Test both success and error cases

4. **Test examples to include**

```typescript
import { describe, it, expect } from 'vitest';
import { getNextOccurrence, getNthWeekdayOfMonth } from '@/services/recurrence';

describe('Recurrence Calculations', () => {
  describe('Weekly patterns', () => {
    it('should calculate next week from given date', () => {
      const pattern = {
        frequency: 'weekly',
        // ...
      };
      const result = getNextOccurrence(pattern, new Date('2025-10-10'));
      expect(result).toEqual(new Date('2025-10-17'));
    });
  });

  describe('Nth weekday of month', () => {
    it('should find first Monday of October 2025', () => {
      const result = getNthWeekdayOfMonth(2025, 9, 1, 1); // month is 0-indexed
      expect(result).toEqual(new Date('2025-10-06'));
    });

    it('should find last Friday of February 2025', () => {
      const result = getNthWeekdayOfMonth(2025, 1, 5, -1);
      expect(result).toEqual(new Date('2025-02-28'));
    });

    it('should handle months with 4 vs 5 occurrences of weekday', () => {
      // Test month with only 4 Saturdays
      const result = getNthWeekdayOfMonth(2025, 10, 6, 5);
      expect(result).toBeNull(); // No 5th Saturday
    });
  });

  describe('Yearly patterns', () => {
    it('should handle leap year February 29', () => {
      const pattern = {
        frequency: 'yearly',
        yearlyConfig: { month: 2, day: 29 }
      };
      
      // 2024 is leap year
      const result2024 = getNextOccurrence(pattern, new Date('2024-01-01'));
      expect(result2024).toEqual(new Date('2024-02-29'));
      
      // 2025 is not leap year - should use Feb 28
      const result2025 = getNextOccurrence(pattern, new Date('2025-01-01'));
      expect(result2025).toEqual(new Date('2025-02-28'));
    });

    it('should calculate Thanksgiving (4th Thursday of November)', () => {
      const pattern = {
        frequency: 'yearly',
        yearlyNthWeekday: { month: 11, weekday: 4, occurrence: 4 }
      };
      const result = getNextOccurrence(pattern, new Date('2025-01-01'));
      expect(result).toEqual(new Date('2025-11-27')); // Verify actual date
    });
  });

  describe('Every N days pattern', () => {
    it('should calculate every 3 days', () => {
      const pattern = {
        frequency: 'every_n_days',
        frequencyValue: 3
      };
      const result = getNextOccurrence(pattern, new Date('2025-10-10'));
      expect(result).toEqual(new Date('2025-10-13'));
    });

    it('should handle month boundaries', () => {
      const pattern = {
        frequency: 'every_n_days',
        frequencyValue: 5
      };
      const result = getNextOccurrence(pattern, new Date('2025-10-29'));
      expect(result).toEqual(new Date('2025-11-03'));
    });
  });
});
```

5. **Coverage goals**
   - Aim for 100% coverage of recurrence calculation functions
   - Test all branches and edge cases
   - Include timezone edge cases if applicable

Remember:
- Recurrence logic is critical - thorough testing is essential
- Use real dates from calendar to verify calculations
- Test boundary conditions extensively
- Document any assumptions about timezone or locale
