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
    macros: saved.macros || {
      proteinTaken: 120, proteinTarget: 150,
      carbsTaken: 180, carbsTarget: 220,
      fatsTaken: 45, fatsTarget: 60,
    },
    muscleFocus: saved.muscleFocus || ['Chest', 'Arms'],
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
  const [macros, setMacros] = useState({
    proteinTaken: 120, proteinTarget: 150,
    carbsTaken: 180, carbsTarget: 220,
    fatsTaken: 45, fatsTarget: 60,
  });
  const [muscleFocus, setMuscleFocus] = useState(['Chest', 'Arms']);

  // Multi-week plan metadata
  const [multiWeekPlan, setMultiWeekPlan] = useState({});
  const [currentWeekIndex, setCurrentWeekIndex] = useState({});

  // ── Apply a saved data object to state ──
  const applyData = useCallback((savedData) => {
    if (!savedData || typeof savedData !== 'object' || Array.isArray(savedData)) return;

    // Guard: Must contain at least one recognized payload property
    const hasPayloadKeys =
      savedData.schedule ||
      savedData.categories ||
      savedData.taskStatuses ||
      savedData.macros ||
      savedData.dayStatus;

    if (!hasPayloadKeys) return;

    const migrated = migrateTaskStatuses(savedData);

    if (migrated.theme) setTheme(migrated.theme);
    if (migrated.categories) setCategories(migrated.categories);

    // Only apply schedule if it has task items
    if (migrated.schedule) {
      const totalTasks = Object.values(migrated.schedule).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      if (totalTasks > 0) {
        setSchedule(migrated.schedule);
      }
    }

    if (migrated.meals) setMeals(migrated.meals);
    if (migrated.dayStatus) setDayStatus(migrated.dayStatus);
    if (migrated.taskStatuses && Object.keys(migrated.taskStatuses).length > 0) {
      setTaskStatuses(migrated.taskStatuses);
    }
    if (migrated.rawText) setRawText(migrated.rawText);
    if (migrated.multiWeekPlan) setMultiWeekPlan(migrated.multiWeekPlan);
    if (migrated.currentWeekIndex) setCurrentWeekIndex(migrated.currentWeekIndex);
    if (migrated.goals) setGoals(migrated.goals);
    if (migrated.sleepSchedule) setSleepSchedule(migrated.sleepSchedule);
    if (migrated.macros) setMacros(migrated.macros);
    if (migrated.muscleFocus) setMuscleFocus(migrated.muscleFocus);
  }, []);

  // ── Load from localStorage on mount ──
  useEffect(() => {
    const saved = loadWeekData(weekKey);
    applyData(saved);
    initialized.current = true;
  }, [weekKey, applyData]);

  // ── Auto-Calculate Streak based on consecutive daily visits ──
  useEffect(() => {
    try {
      const todayStr = dateKey(new Date());
      const lastVisit = localStorage.getItem('cadence_last_visit_date');
      const savedStreak = Number(localStorage.getItem('cadence_user_streak')) || 1;

      if (!lastVisit) {
        localStorage.setItem('cadence_last_visit_date', todayStr);
        localStorage.setItem('cadence_user_streak', '1');
        setStreak(1);
      } else if (lastVisit !== todayStr) {
        const lastDate = new Date(lastVisit);
        const currDate = new Date(todayStr);
        const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Visited yesterday -> Increment Streak!
          const newStreak = savedStreak + 1;
          localStorage.setItem('cadence_last_visit_date', todayStr);
          localStorage.setItem('cadence_user_streak', String(newStreak));
          setStreak(newStreak);
        } else if (diffDays > 1) {
          // Missed 1+ days -> Reset Streak to 1
          localStorage.setItem('cadence_last_visit_date', todayStr);
          localStorage.setItem('cadence_user_streak', '1');
          setStreak(1);
        }
      } else {
        setStreak(savedStreak);
      }
    } catch {
      // fallback
    }
  }, []);

  // ── Load from cloud when user signs in ──
  useEffect(() => {
    if (!user || cloudLoaded.current) return;

    cloudLoad(user.id).then((allCloudData) => {
      if (allCloudData && Object.keys(allCloudData).length > 0) {
        // allCloudData is a flat map: { "2026-07-20": {...}, "settings": {...}, ... }
        if (allCloudData['settings']) {
          applyData(allCloudData['settings']);
        }
        if (allCloudData[weekKey]) {
          applyData(allCloudData[weekKey]);
        } else {
          // Fallback: apply the first entry if weekKey is not found
          const firstKey = Object.keys(allCloudData).find((k) => k !== 'settings') || Object.keys(allCloudData)[0];
          if (firstKey) applyData(allCloudData[firstKey]);
        }
        cloudLoaded.current = true;
      } else if (allCloudData) {
        // Cloud returned empty object (user has no data yet in cloud)
        cloudLoaded.current = true;
      }
    });
  }, [user, weekKey, applyData]);

  // ── Auto-save to localStorage + Cloud ──
  useEffect(() => {
    if (!initialized.current) return;

    const payload = {
      theme,
      categories,
      schedule,
      meals,
      dayStatus,
      taskStatuses,
      rawText,
      multiWeekPlan,
      currentWeekIndex,
      goals,
      streak,
      sleepSchedule,
      macros,
      muscleFocus,
    };

    saveWeekData(weekKey, payload);

    if (user && cloudLoaded.current) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        cloudSave(weekKey, payload, user.id);
      }, 2000);
    }
  }, [
    weekKey,
    theme,
    categories,
    schedule,
    meals,
    dayStatus,
    taskStatuses,
    rawText,
    multiWeekPlan,
    currentWeekIndex,
    goals,
    streak,
    sleepSchedule,
    macros,
    muscleFocus,
    user,
  ]);

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
    macros, setMacros,
    muscleFocus, setMuscleFocus,
  };
}
