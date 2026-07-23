import { useState, useEffect, useRef, useCallback } from 'react';
import { saveWeekData, loadWeekData } from '../services/storage';
import { dateKey } from '../utils/dateUtils';
import { cloudSave, cloudLoad } from '../services/cloudSync';

/**
 * Migration helper: converts legacy data formats:
 * 1. Legacy `actualMinutes` / `mealsLogged` -> `taskStatuses` map.
 * 2. Legacy `study` category -> split into `skill` and `college`.
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

  // Migrate 2-category state to 3-category state (skill, college, gym)
  const rawSchedule = saved.schedule || {};
  const schedule = {
    skill: rawSchedule.skill || rawSchedule.study || [],
    college: rawSchedule.college || [],
    gym: rawSchedule.gym || [],
  };

  const rawTextObj = saved.rawText || {};
  const rawText = {
    skill: rawTextObj.skill || rawTextObj.study || '',
    college: rawTextObj.college || '',
    gym: rawTextObj.gym || '',
  };

  const rawMW = saved.multiWeekPlan || {};
  const multiWeekPlan = {
    skill: rawMW.skill || rawMW.study || null,
    college: rawMW.college || null,
    gym: rawMW.gym || null,
  };

  const rawCWI = saved.currentWeekIndex || {};
  const currentWeekIndex = {
    skill: rawCWI.skill || rawCWI.study || 0,
    college: rawCWI.college || 0,
    gym: rawCWI.gym || 0,
  };

  return {
    ...saved,
    schedule,
    rawText,
    multiWeekPlan,
    currentWeekIndex,
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

  const [rawText, setRawText] = useState({ skill: '', college: '', gym: '' });
  const [schedule, setSchedule] = useState({ skill: [], college: [], gym: [] });
  const [meals, setMeals] = useState([]);
  const [dayStatus, setDayStatus] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});
  const [goals, setGoals] = useState([]);

  // Multi-week plan metadata
  const [multiWeekPlan, setMultiWeekPlan] = useState({ skill: null, college: null, gym: null });
  const [currentWeekIndex, setCurrentWeekIndex] = useState({ skill: 0, college: 0, gym: 0 });

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
