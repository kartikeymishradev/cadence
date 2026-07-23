import { useState, useEffect, useRef, useCallback } from 'react';
import { saveWeekData, loadWeekData } from '../services/storage';
import { dateKey } from '../utils/dateUtils';
import { cloudSave, cloudLoad } from '../services/cloudSync';

export const DEFAULT_CATEGORIES = [
  { id: 'skill', label: 'Skill Prep', icon: 'BookOpen', color: '#5F8467' },
  { id: 'college', label: 'College', icon: 'GraduationCap', color: '#33414A' },
  { id: 'gym', label: 'Gym & Diet', icon: 'Dumbbell', color: '#C9922B' },
];

/**
 * Migration helper for taskStatuses, custom categories, and dynamic schedule maps.
 */
export function migrateTaskStatuses(saved) {
  if (!saved) return { taskStatuses: {}, goals: [], categories: DEFAULT_CATEGORIES };

  const taskStatuses = saved.taskStatuses ? { ...saved.taskStatuses } : {};

  // Migrate legacy actualMinutes
  if (saved.actualMinutes) {
    Object.entries(saved.actualMinutes).forEach(([id, minutes]) => {
      if (minutes > 0 && !taskStatuses[id]) {
        taskStatuses[id] = { status: 'done', actualMinutes: Number(minutes) };
      }
    });
  }

  // Migrate legacy categories
  const categories = saved.categories && saved.categories.length > 0
    ? saved.categories
    : DEFAULT_CATEGORIES;

  // Migrate schedule map
  const rawSchedule = saved.schedule || {};
  const schedule = { ...rawSchedule };
  if (rawSchedule.study && !schedule.skill) {
    schedule.skill = rawSchedule.study;
  }

  categories.forEach((cat) => {
    if (!schedule[cat.id]) schedule[cat.id] = [];
  });

  // Migrate rawText map
  const rawTextObj = saved.rawText || {};
  const rawText = { ...rawTextObj };
  if (rawTextObj.study && !rawText.skill) {
    rawText.skill = rawTextObj.study;
  }
  categories.forEach((cat) => {
    if (!rawText[cat.id]) rawText[cat.id] = '';
  });

  return {
    ...saved,
    schedule,
    rawText,
    categories,
    taskStatuses,
    theme: saved.theme || 'paper',
    goals: saved.goals || [],
    streak: saved.streak || 1,
    sleepSchedule: saved.sleepSchedule || { sleepStart: '23:30', sleepEnd: '07:00' },
  };
}

/**
 * Hook that syncs schedule state & custom categories with localStorage + Supabase cloud.
 */
export function usePersistence(weekStart, user) {
  const weekKey = dateKey(weekStart);
  const initialized = useRef(false);
  const cloudLoaded = useRef(false);
  const saveTimer = useRef(null);

  const [theme, setTheme] = useState('paper');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [rawText, setRawText] = useState({ skill: '', college: '', gym: '' });
  const [schedule, setSchedule] = useState({ skill: [], college: [], gym: [] });
  const [meals, setMeals] = useState([]);
  const [dayStatus, setDayStatus] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});
  const [goals, setGoals] = useState([]);
  const [streak, setStreak] = useState(1);
  const [sleepSchedule, setSleepSchedule] = useState({ sleepStart: '23:30', sleepEnd: '07:00' });

  // Multi-week plan metadata
  const [multiWeekPlan, setMultiWeekPlan] = useState({});
  const [currentWeekIndex, setCurrentWeekIndex] = useState({});

  // ── Apply a saved data object to state ──
  const applyData = useCallback((savedData) => {
    if (!savedData) return;
    const migrated = migrateTaskStatuses(savedData);

    if (migrated.theme) setTheme(migrated.theme);
    if (migrated.categories) setCategories(migrated.categories);
    if (migrated.schedule) setSchedule(migrated.schedule);
    if (migrated.meals) setMeals(migrated.meals);
    if (migrated.dayStatus) setDayStatus(migrated.dayStatus);
    if (migrated.taskStatuses) setTaskStatuses(migrated.taskStatuses);
    if (migrated.rawText) setRawText(migrated.rawText);
    if (migrated.multiWeekPlan) setMultiWeekPlan(migrated.multiWeekPlan);
    if (migrated.currentWeekIndex) setCurrentWeekIndex(migrated.currentWeekIndex);
    if (migrated.goals) setGoals(migrated.goals);
    if (migrated.streak) setStreak(migrated.streak);
    if (migrated.sleepSchedule) setSleepSchedule(migrated.sleepSchedule);
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

  useEffect(() => {
    cloudLoaded.current = false;
  }, [user?.id]);

  // ── Auto-save (debounced) to localStorage + cloud ──
  useEffect(() => {
    if (!initialized.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = {
        theme,
        categories,
        schedule,
        meals,
        dayStatus,
        taskStatuses,
        goals,
        rawText,
        multiWeekPlan,
        currentWeekIndex,
        streak,
        sleepSchedule,
      };

      saveWeekData(weekKey, payload);

      if (user) {
        cloudSave(`week_${weekKey}`, payload);
      }
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [weekKey, user, categories, schedule, meals, dayStatus, taskStatuses, goals, rawText, multiWeekPlan, currentWeekIndex, streak, sleepSchedule]);

  return {
    theme, setTheme,
    categories, setCategories,
    rawText, setRawText,
    schedule, setSchedule,
    meals, setMeals,
    dayStatus, setDayStatus,
    taskStatuses, setTaskStatuses,
    goals, setGoals,
    multiWeekPlan, setMultiWeekPlan,
    currentWeekIndex, setCurrentWeekIndex,
    streak, setStreak,
    sleepSchedule, setSleepSchedule,
  };
}
