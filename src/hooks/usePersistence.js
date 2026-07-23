import { useState, useEffect, useRef, useCallback } from 'react';
import { saveWeekData, loadWeekData } from '../services/storage';
import { dateKey } from '../utils/dateUtils';
import { cloudSave, cloudLoad } from '../services/cloudSync';

/**
 * Migration helper: converts legacy `actualMinutes` and `mealsLogged`
 * to unified `taskStatuses` map.
 * Format: { [taskId]: { status: 'done'|'partial'|'skipped'|'pending', actualMinutes: number } }
 */
export function migrateTaskStatuses(saved) {
  if (!saved) return { taskStatuses: {}, goals: [] };

  const taskStatuses = saved.taskStatuses ? { ...saved.taskStatuses } : {};

  // Migrate legacy actualMinutes
  if (saved.actualMinutes) {
    Object.entries(saved.actualMinutes).forEach(([id, minutes]) => {
      if (minutes > 0 && !taskStatuses[id]) {
        taskStatuses[id] = { status: 'done', actualMinutes: Number(minutes) };
      }
    });
  }

  // Migrate legacy mealsLogged
  if (saved.mealsLogged) {
    Object.entries(saved.mealsLogged).forEach(([id, isLogged]) => {
      if (isLogged && !taskStatuses[id]) {
        taskStatuses[id] = { status: 'done', actualMinutes: 0 };
      }
    });
  }

  return {
    ...saved,
    taskStatuses,
    goals: saved.goals || [],
  };
}

/**
 * Hook that syncs schedule state with localStorage (always)
 * and Supabase cloud (when user is logged in).
 */
export function usePersistence(weekStart, user) {
  const weekKey = dateKey(weekStart);
  const initialized = useRef(false);
  const cloudLoaded = useRef(false);
  const saveTimer = useRef(null);

  const [rawText, setRawText] = useState({ study: '', gym: '' });
  const [schedule, setSchedule] = useState({ study: [], gym: [] });
  const [meals, setMeals] = useState([]);
  const [dayStatus, setDayStatus] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});
  const [goals, setGoals] = useState([]);

  // Multi-week plan metadata
  const [multiWeekPlan, setMultiWeekPlan] = useState({ study: null, gym: null });
  const [currentWeekIndex, setCurrentWeekIndex] = useState({ study: 0, gym: 0 });

  // ── Apply a saved data object to state (with migration) ──
  const applyData = useCallback((savedData) => {
    if (!savedData) return;
    const migrated = migrateTaskStatuses(savedData);

    if (migrated.schedule) setSchedule(migrated.schedule);
    if (migrated.meals) setMeals(migrated.meals);
    if (migrated.dayStatus) setDayStatus(migrated.dayStatus);
    if (migrated.taskStatuses) setTaskStatuses(migrated.taskStatuses);
    if (migrated.rawText) setRawText(migrated.rawText);
    if (migrated.multiWeekPlan) setMultiWeekPlan(migrated.multiWeekPlan);
    if (migrated.currentWeekIndex) setCurrentWeekIndex(migrated.currentWeekIndex);
    if (migrated.goals) setGoals(migrated.goals);
  }, []);

  // ── Load from localStorage on mount ──
  useEffect(() => {
    const saved = loadWeekData(weekKey);
    applyData(saved);
    initialized.current = true;
  }, [weekKey, applyData]);

  // ── Load from cloud when user signs in ──
  useEffect(() => {
    if (!user || cloudLoaded.current) return;

    cloudLoad().then((cloudData) => {
      if (!cloudData) return;
      const saved = cloudData[`week_${weekKey}`];
      if (saved) {
        applyData(saved);
      }
      cloudLoaded.current = true;
    });
  }, [user, weekKey, applyData]);

  // Reset cloud load flag when user changes (logout/login)
  useEffect(() => {
    cloudLoaded.current = false;
  }, [user?.id]);

  // ── Auto-save (debounced) to localStorage + cloud ──
  useEffect(() => {
    if (!initialized.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = {
        schedule,
        meals,
        dayStatus,
        taskStatuses,
        goals,
        rawText,
        multiWeekPlan,
        currentWeekIndex,
      };

      // Always save locally
      saveWeekData(weekKey, payload);

      // Save to cloud if signed in
      if (user) {
        cloudSave(`week_${weekKey}`, payload);
      }
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [weekKey, user, schedule, meals, dayStatus, taskStatuses, goals, rawText, multiWeekPlan, currentWeekIndex]);

  return {
    rawText, setRawText,
    schedule, setSchedule,
    meals, setMeals,
    dayStatus, setDayStatus,
    taskStatuses, setTaskStatuses,
    goals, setGoals,
    multiWeekPlan, setMultiWeekPlan,
    currentWeekIndex, setCurrentWeekIndex,
  };
}
