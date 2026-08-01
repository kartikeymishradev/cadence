const PREFIX = 'cadence_';

function storageKey(weekStart, field) {
  return `${PREFIX}${weekStart}_${field}`;
}

const ALL_FIELDS = [
  'schedule',
  'meals',
  'dayStatus',
  'actualMinutes',
  'mealsLogged',
  'rawText',
  'theme',
  'categories',
  'taskStatuses',
  'multiWeekPlan',
  'currentWeekIndex',
  'goals',
  'streak',
  'sleepSchedule',
  'macros',
  'muscleFocus',
  'subjectRegistry',
];

/**
 * Save all schedule data for a given week to localStorage.
 * @param {string} weekStart – ISO date of Monday (e.g. "2026-07-20")
 * @param {Object} data – fields to persist (schedule, meals, dayStatus, etc.)
 */
export function saveWeekData(weekStart, data) {
  try {
    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        localStorage.setItem(storageKey(weekStart, field), JSON.stringify(value));
      }
    }
  } catch (e) {
    console.warn('Dintaal: localStorage save failed', e);
  }
}

/**
 * Load schedule data for a given week from localStorage.
 * Returns an object with whichever fields were found.
 */
export function loadWeekData(weekStart) {
  const result = {};
  try {
    for (const field of ALL_FIELDS) {
      const stored = localStorage.getItem(storageKey(weekStart, field));
      if (stored !== null && stored !== 'undefined') {
        try {
          result[field] = JSON.parse(stored);
        } catch (err) {
          // ignore corrupted JSON
        }
      }
    }
  } catch (e) {
    console.warn('Dintaal: localStorage load failed', e);
  }
  return result;
}

/**
 * Remove all saved data for a given week.
 */
export function clearWeekData(weekStart) {
  for (const field of ALL_FIELDS) {
    localStorage.removeItem(storageKey(weekStart, field));
  }
}
