import { useState, useEffect, useRef } from 'react';
import { saveWeekData, loadWeekData } from '../services/storage';
import { dateKey } from '../utils/dateUtils';

/**
 * Hook that syncs schedule state & multi-week metadata with localStorage.
 */
export function usePersistence(weekStart) {
  const weekKey = dateKey(weekStart);
  const initialized = useRef(false);
  const saveTimer = useRef(null);

  const [rawText, setRawText] = useState({ study: '', gym: '' });
  const [schedule, setSchedule] = useState({ study: [], gym: [] });
  const [meals, setMeals] = useState([]);
  const [dayStatus, setDayStatus] = useState({});
  const [actualMinutes, setActualMinutes] = useState({});
  const [mealsLogged, setMealsLogged] = useState({});

  // Multi-week plan metadata
  const [multiWeekPlan, setMultiWeekPlan] = useState({ study: null, gym: null });
  const [currentWeekIndex, setCurrentWeekIndex] = useState({ study: 0, gym: 0 });

  // ── Load from localStorage on mount ──
  useEffect(() => {
    const saved = loadWeekData(weekKey);
    if (saved.schedule) setSchedule(saved.schedule);
    if (saved.meals) setMeals(saved.meals);
    if (saved.dayStatus) setDayStatus(saved.dayStatus);
    if (saved.actualMinutes) setActualMinutes(saved.actualMinutes);
    if (saved.mealsLogged) setMealsLogged(saved.mealsLogged);
    if (saved.rawText) setRawText(saved.rawText);
    if (saved.multiWeekPlan) setMultiWeekPlan(saved.multiWeekPlan);
    if (saved.currentWeekIndex) setCurrentWeekIndex(saved.currentWeekIndex);
    initialized.current = true;
  }, [weekKey]);

  // ── Auto-save on change (debounced) ──
  useEffect(() => {
    if (!initialized.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWeekData(weekKey, {
        schedule,
        meals,
        dayStatus,
        actualMinutes,
        mealsLogged,
        rawText,
        multiWeekPlan,
        currentWeekIndex,
      });
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [weekKey, schedule, meals, dayStatus, actualMinutes, mealsLogged, rawText, multiWeekPlan, currentWeekIndex]);

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
