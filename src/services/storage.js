const PREFIX = 'cadence_';

function storageKey(weekStart, field) {
  return `${PREFIX}${weekStart}_${field}`;
}

/**
 * Save all schedule data for a given week to localStorage.
 * @param {string} weekStart – ISO date of Monday (e.g. "2026-07-20")
 * @param {Object} data – fields to persist (schedule, meals, dayStatus, etc.)
 */
export function saveWeekData(weekStart, data) {
  try {
    for (const [field, value] of Object.entries(data)) {
      localStorage.setItem(storageKey(weekStart, field), JSON.stringify(value));
    }
  } catch (e) {
    console.warn('Cadence: localStorage save failed', e);
  }
}

/**
 * Load schedule data for a given week from localStorage.
 * Returns an object with whichever fields were found.
 */
export function loadWeekData(weekStart) {
  const fields = [
    'schedule', 'meals', 'dayStatus',
    'actualMinutes', 'mealsLogged', 'rawText',
  ];
  const result = {};
  try {
    for (const field of fields) {
      const stored = localStorage.getItem(storageKey(weekStart, field));
      if (stored !== null) {
        result[field] = JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn('Cadence: localStorage load failed', e);
  }
  return result;
}

/**
 * Remove all saved data for a given week.
 */
export function clearWeekData(weekStart) {
  const fields = [
    'schedule', 'meals', 'dayStatus',
    'actualMinutes', 'mealsLogged', 'rawText',
  ];
  for (const field of fields) {
    localStorage.removeItem(storageKey(weekStart, field));
  }
}
