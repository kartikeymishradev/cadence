import { useState, useEffect, useRef, useCallback } from 'react';
import { saveWeekData, loadWeekData } from '../services/storage';
import { dateKey } from '../utils/dateUtils';
import { cloudSave, cloudLoad } from '../services/cloudSync';

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
  const [actualMinutes, setActualMinutes] = useState({});
  const [mealsLogged, setMealsLogged] = useState({});
  const [multiWeekPlan, setMultiWeekPlan] = useState({ study: null, gym: null });
  const [currentWeekIndex, setCurrentWeekIndex] = useState({ study: 0, gym: 0 });

  // ── Apply a saved data object to state ──
  const applyData = useCallback((saved) => {
    if (!saved) return;
    if (saved.schedule) setSchedule(saved.schedule);
    if (saved.meals) setMeals(saved.meals);
    if (saved.dayStatus) setDayStatus(saved.dayStatus);
    if (saved.actualMinutes) setActualMinutes(saved.actualMinutes);
    if (saved.mealsLogged) setMealsLogged(saved.mealsLogged);
    if (saved.rawText) setRawText(saved.rawText);
    if (saved.multiWeekPlan) setMultiWeekPlan(saved.multiWeekPlan);
    if (saved.currentWeekIndex) setCurrentWeekIndex(saved.currentWeekIndex);
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
        actualMinutes,
        mealsLogged,
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
  }, [weekKey, user, schedule, meals, dayStatus, actualMinutes, mealsLogged, rawText, multiWeekPlan, currentWeekIndex]);

  return {
    rawText, setRawText,
    schedule, setSchedule,
    meals, setMeals,
    dayStatus, setDayStatus,
    actualMinutes, setActualMinutes,
    mealsLogged, setMealsLogged,
    multiWeekPlan, setMultiWeekPlan,
    currentWeekIndex, setCurrentWeekIndex,
  };
}
