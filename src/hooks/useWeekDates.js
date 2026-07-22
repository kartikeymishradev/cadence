import { useMemo } from 'react';
import { startOfWeek, dateKey } from '../utils/dateUtils';
import { WEEKDAYS } from '../utils/constants';

/**
 * Computes the current week's start date and an array of 7 Date objects (Mon–Sun).
 */
export function useWeekDates() {
  const weekStart = useMemo(() => startOfWeek(new Date()), []);

  const weekDates = useMemo(
    () =>
      WEEKDAYS.map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  return { weekStart, weekDates, dateKey };
}
