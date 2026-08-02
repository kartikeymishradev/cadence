import { useState, useEffect, useRef, useCallback } from 'react';
import { saveWeekData, loadWeekData } from '../services/storage';
import { dateKey } from '../utils/dateUtils';
import { cloudSave, cloudLoad } from '../services/cloudSync';

export const DEFAULT_CATEGORIES = [
  { id: 'college', label: 'College / Academics', icon: 'GraduationCap', color: '#33414A' },
  { id: 'skill', label: 'Career & Skills', icon: 'Briefcase', color: '#5F8467' },
  { id: 'gym', label: 'Health & Body', icon: 'Activity', color: '#C9922B' },
  { id: 'growth', label: 'Personal Growth', icon: 'Sparkles', color: '#8B5CF6' },
];

export const DEFAULT_SUBJECT_REGISTRY = {
  college: [
    { id: 'subj-big-data', name: 'Big Data Technologies', color: '#5F8467' },
    { id: 'subj-fintech-corel', name: 'Financial Co-relations', color: '#33414A' },
    { id: 'subj-intro-fintech', name: 'Introduction to Fintech', color: '#4F46E5' },
    { id: 'subj-intro-iot', name: 'Introduction to IoT', color: '#C9922B' },
    { id: 'subj-daa', name: 'Design & Analysis of Algorithm', color: '#059669' },
    { id: 'subj-constitution', name: 'Constitution of India', color: '#7C3AED' },
  ],
  skill: [
    { id: 'subj-dsa', name: 'Data Structures & Algorithms', color: '#5F8467' },
    { id: 'subj-system-design', name: 'System Design', color: '#33414A' },
  ],
  gym: [
    { id: 'subj-workout', name: 'Workout & Fitness', color: '#C9922B' },
  ],
  growth: [
    { id: 'subj-reading', name: 'Reading & Learning', color: '#8B5CF6' },
    { id: 'subj-habits', name: 'Daily Habits & Mindset', color: '#EC4899' },
  ],
};

export const DEFAULT_SEMESTER_CONFIG = {
  semesterStart: '2026-07-15',
  semesterEnd: '2026-12-20',
};

/**
 * Migration helper for taskStatuses, custom categories, subjectRegistry, and dynamic schedule maps.
 */
export function migrateTaskStatuses(saved) {
  if (!saved) return { taskStatuses: {}, goals: [], categories: DEFAULT_CATEGORIES, subjectRegistry: {} };

  const taskStatuses = saved.taskStatuses ? { ...saved.taskStatuses } : {};

  // Migrate legacy actualMinutes
  if (saved.actualMinutes) {
    Object.entries(saved.actualMinutes).forEach(([id, minutes]) => {
      if (minutes > 0 && !taskStatuses[id]) {
        taskStatuses[id] = { status: 'done', actualMinutes: Number(minutes) };
      }
    });
  }

  // ── Issue 2: Migrate stale 'Skill Prep' category label → 'Career & Skills' ──
  const categories = (() => {
    const raw = saved.categories && saved.categories.length > 0
      ? saved.categories
      : DEFAULT_CATEGORIES;
    return raw.map((c) =>
      c.id === 'skill' && c.label === 'Skill Prep'
        ? { ...c, label: 'Career & Skills' }
        : c
    );
  })();

  // ── Issue 1: Empty registry for genuinely new users ──
  // Existing users who already saved a registry keep it (merged with DEFAULT to pick up new subjects).
  // Brand-new users (no saved registry at all) start empty — no personal seed data imposed.
  const subjectRegistry = saved.subjectRegistry && Object.keys(saved.subjectRegistry).length > 0
    ? { ...DEFAULT_SUBJECT_REGISTRY, ...saved.subjectRegistry }
    : {};

  // Migrate schedule map & auto-match subjects
  const rawSchedule = saved.schedule || {};
  const schedule = { ...rawSchedule };
  if (rawSchedule.study && !schedule.skill) {
    schedule.skill = rawSchedule.study;
  }

  categories.forEach((cat) => {
    if (!schedule[cat.id]) schedule[cat.id] = [];
  });

  // Auto-matcher for existing tasks without a subjectId
  Object.keys(schedule).forEach((catId) => {
    const registryForCat = subjectRegistry[catId] || [];
    schedule[catId] = (schedule[catId] || []).map((task) => {
      if (task.subjectId) return task;

      const titleLower = String(task.title || '').toLowerCase();
      const matched = registryForCat.find((subj) => {
        const nameLower = subj.name.toLowerCase();
        if (titleLower.includes(nameLower)) return true;
        if (subj.name === 'Design & Analysis of Algorithm' && (titleLower.includes('daa') || titleLower.includes('algorithm'))) return true;
        if (subj.name === 'Big Data Technologies' && titleLower.includes('big data')) return true;
        if (subj.name === 'Introduction to IoT' && titleLower.includes('iot')) return true;
        if (subj.name === 'Constitution of India' && (titleLower.includes('constitution') || titleLower.includes('coi'))) return true;
        if (subj.name === 'Financial Co-relations' && titleLower.includes('financial')) return true;
        return false;
      });

      return {
        ...task,
        subjectId: matched ? matched.id : null,
      };
    });
  });

  // ── Issue 3: Migrate old task IDs (catId-idx) → new day-scoped IDs (catId-day-idx) ──
  // Old format: 'college-3'  →  new format: 'college-Wednesday-3'
  // Only keys matching /^[a-z]+-\d+$/ (no day segment) are migrated.
  // If the task at that index no longer exists in the schedule (re-parse happened), the entry is dropped.
  const oldIdPattern = /^([a-z]+)-([0-9]+)$/;
  Object.keys(taskStatuses).forEach((oldKey) => {
    if (!oldIdPattern.test(oldKey)) return; // already new format or unrecognised — skip
    const [, catId, idxStr] = oldKey.match(oldIdPattern);
    const idx = parseInt(idxStr, 10);
    const task = schedule[catId]?.[idx];
    if (task?.day) {
      const newKey = `${catId}-${task.day}-${idx}`;
      if (!taskStatuses[newKey]) {
        taskStatuses[newKey] = taskStatuses[oldKey];
      }
    }
    // Whether migrated or orphaned, remove old key
    delete taskStatuses[oldKey];
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
    subjectRegistry,
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
    focusLogs: saved.focusLogs || {},
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

  const userId = user?.id || null;
  const activeUserIdRef = useRef(userId);

  // ── State Declarations ──
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
  const [focusLogs, setFocusLogs] = useState({});
  const [multiWeekPlan, setMultiWeekPlan] = useState({});
  const [currentWeekIndex, setCurrentWeekIndex] = useState({});
  const [subjectRegistry, setSubjectRegistry] = useState({});
  const [weeklyReflection, setWeeklyReflection] = useState({
    wentWell: '',
    biggestDistraction: '',
    nextWeekFocus: '',
  });
  const [semesterConfig, setSemesterConfig] = useState(DEFAULT_SEMESTER_CONFIG);
  const [sleepLogs, setSleepLogs] = useState({});

  // Helper to reset state back to clean defaults
  const resetStateToDefaults = useCallback(() => {
    setTheme('paper');
    setCategories(DEFAULT_CATEGORIES);
    setRawText({ skill: '', college: '', gym: '' });
    setSchedule({ skill: [], college: [], gym: [] });
    setMeals([]);
    setDayStatus({});
    setTaskStatuses({});
    setGoals([]);
    setStreak(1);
    setSleepSchedule({ sleepStart: '23:30', sleepEnd: '07:00' });
    setMacros({
      proteinTaken: 120, proteinTarget: 150,
      carbsTaken: 180, carbsTarget: 220,
      fatsTaken: 45, fatsTarget: 60,
    });
    setMuscleFocus(['Chest', 'Arms']);
    setFocusLogs({});
    setMultiWeekPlan({});
    setCurrentWeekIndex({});
    setSubjectRegistry({});
    setWeeklyReflection({ wentWell: '', biggestDistraction: '', nextWeekFocus: '' });
    setSemesterConfig(DEFAULT_SEMESTER_CONFIG);
    setSleepLogs({});
  }, []);

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

    if (migrated.schedule) {
      setSchedule(migrated.schedule);
    }

    if (migrated.meals !== undefined) {
      setMeals(migrated.meals || []);
    }
    if (migrated.dayStatus) setDayStatus(migrated.dayStatus);
    if (migrated.taskStatuses && Object.keys(migrated.taskStatuses).length > 0) {
      setTaskStatuses(migrated.taskStatuses);
    }
    if (migrated.rawText) setRawText(migrated.rawText);
    if (migrated.multiWeekPlan) setMultiWeekPlan(migrated.multiWeekPlan);
    if (migrated.currentWeekIndex) setCurrentWeekIndex(migrated.currentWeekIndex);
    if (migrated.goals) setGoals(migrated.goals);
    if (migrated.streak) {
      const val = Number(migrated.streak) || 1;
      setStreak((curr) => Math.max(curr, val));
      localStorage.setItem('cadence_user_streak', String(val));
    }
    if (migrated.sleepSchedule) setSleepSchedule(migrated.sleepSchedule);
    if (migrated.macros) setMacros(migrated.macros);
    if (migrated.muscleFocus) setMuscleFocus(migrated.muscleFocus);
    if (migrated.focusLogs) setFocusLogs(migrated.focusLogs);
    if (migrated.subjectRegistry) setSubjectRegistry(migrated.subjectRegistry);
    if (migrated.weeklyReflection) setWeeklyReflection(migrated.weeklyReflection);
    if (migrated.semesterConfig) setSemesterConfig(migrated.semesterConfig);
    if (migrated.sleepLogs) setSleepLogs(migrated.sleepLogs);
  }, []);

  // ── Load from user-scoped localStorage on mount & when user changes ──
  useEffect(() => {
    // If user changed (e.g. logout or switch account), reset state first
    if (activeUserIdRef.current !== userId) {
      activeUserIdRef.current = userId;
      cloudLoaded.current = false;
      resetStateToDefaults();
    }

    const saved = loadWeekData(weekKey, userId);
    applyData(saved);
    initialized.current = true;
  }, [weekKey, userId, applyData, resetStateToDefaults]);

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
          const newStreak = savedStreak + 1;
          localStorage.setItem('cadence_last_visit_date', todayStr);
          localStorage.setItem('cadence_user_streak', String(newStreak));
          setStreak(newStreak);
        } else if (diffDays > 1) {
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

  // ── Load from cloud when user signs in (isolated to user.id) ──
  useEffect(() => {
    if (!userId || cloudLoaded.current) return;

    cloudLoad(userId).then((allCloudData) => {
      if (allCloudData && Object.keys(allCloudData).length > 0) {
        const localData = loadWeekData(weekKey, userId);
        const cloudData = allCloudData[weekKey] || (allCloudData['settings'] ? allCloudData['settings'] : null);

        const localTs = Number(localData?._lastUpdated) || 0;
        const cloudTs = Number(cloudData?._lastUpdated) || 0;

        if (localTs > cloudTs && localData) {
          // Local storage has newer user edits (e.g. recent task deletions)
          // Preserve local state & immediately push to cloud
          cloudSave(weekKey, localData, userId);
        } else if (cloudData) {
          applyData(cloudData);
        }
      }
      // Always set cloudLoaded = true after attempt so local updates can sync
      cloudLoaded.current = true;
    });
  }, [userId, weekKey, applyData]);

  // ── Auto-save to user-scoped localStorage + Cloud ──
  useEffect(() => {
    if (!initialized.current) return;

    const payload = {
      _lastUpdated: Date.now(),
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
      focusLogs,
      subjectRegistry,
      weeklyReflection,
      semesterConfig,
      sleepLogs,
    };

    saveWeekData(weekKey, payload, userId);

    if (userId && cloudLoaded.current) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        cloudSave(weekKey, payload, userId);
      }, 300);
    }
  }, [
    weekKey,
    userId,
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
    focusLogs,
    subjectRegistry,
    weeklyReflection,
    semesterConfig,
    sleepLogs,
  ]);

  return {
    theme, setTheme,
    categories, setCategories,
    subjectRegistry, setSubjectRegistry,
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
    focusLogs, setFocusLogs,
    weeklyReflection, setWeeklyReflection,
    semesterConfig, setSemesterConfig,
    sleepLogs, setSleepLogs,
  };
}
