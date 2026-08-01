const PREFIX = 'cadence_';

function storageKey(weekStart, field, userId = null) {
  if (userId) {
    return `${PREFIX}${userId}_${weekStart}_${field}`;
  }
  return `${PREFIX}guest_${weekStart}_${field}`;
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
  'weeklyReflection',
  'semesterConfig',
  'sleepLogs',
];

/**
 * Save all schedule data for a given week to localStorage, scoped by userId.
 * @param {string} weekStart – ISO date of Monday (e.g. "2026-07-20")
 * @param {Object} data – fields to persist (schedule, meals, dayStatus, etc.)
 * @param {string|null} userId – Supabase authenticated user ID or null for guest
 */
export function saveWeekData(weekStart, data, userId = null) {
  try {
    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        localStorage.setItem(storageKey(weekStart, field, userId), JSON.stringify(value));
      }
    }
  } catch (e) {
    console.warn('Dintaal: localStorage save failed', e);
  }
}

/**
 * Load schedule data for a given week from localStorage, scoped by userId.
 * Includes smooth migration of legacy un-scoped keys if present.
 * @param {string} weekStart – ISO date of Monday (e.g. "2026-07-20")
 * @param {string|null} userId – Supabase authenticated user ID or null for guest
 */
export function loadWeekData(weekStart, userId = null) {
  const result = {};
  try {
    for (const field of ALL_FIELDS) {
      const scopedKey = storageKey(weekStart, field, userId);
      let stored = localStorage.getItem(scopedKey);

      // Migration check: If scoped key is not found, check legacy un-scoped key
      if (stored === null || stored === 'undefined') {
        const legacyKey = `${PREFIX}${weekStart}_${field}`;
        const legacyStored = localStorage.getItem(legacyKey);
        if (legacyStored !== null && legacyStored !== 'undefined') {
          stored = legacyStored;
          // Auto-migrate legacy key to user-scoped key and clean up
          localStorage.setItem(scopedKey, legacyStored);
          localStorage.removeItem(legacyKey);
        }
      }

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
 * Remove all saved data for a given week, scoped by userId.
 * @param {string} weekStart – ISO date of Monday (e.g. "2026-07-20")
 * @param {string|null} userId – Supabase authenticated user ID or null for guest
 */
export function clearWeekData(weekStart, userId = null) {
  for (const field of ALL_FIELDS) {
    localStorage.removeItem(storageKey(weekStart, field, userId));
    // Also clean up legacy un-scoped key if present
    localStorage.removeItem(`${PREFIX}${weekStart}_${field}`);
  }
}
