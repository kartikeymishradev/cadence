import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import { WEEKDAYS } from './utils/constants';
import { useWeekDates } from './hooks/useWeekDates';
import { usePersistence } from './hooks/usePersistence';
import { usePushNotifications } from './hooks/usePushNotifications';
import { parsePlan, refinePlan } from './services/parser';
import { supabase } from './services/supabase';

import AuthBar from './components/AuthBar';
import Header from './components/Header';
import PlanInput from './components/PlanInput';
import Clarifications from './components/Clarifications';
import WeekNavigator from './components/WeekNavigator';
import PhaseBanner from './components/PhaseBanner';
import WeekStrip from './components/WeekStrip';
import TaskList from './components/TaskList';
import ProgressChart from './components/ProgressChart';
import SummaryCards from './components/SummaryCards';
import InfoFooter from './components/InfoFooter';
import NotificationBanner from './components/NotificationBanner';

export default function App() {
  const { weekStart, weekDates, dateKey } = useWeekDates();

  // ── Auth state (Supabase) ──
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Push notifications ──
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe } =
    usePushNotifications();

  // ── Persisted state ──
  const {
    rawText, setRawText,
    schedule, setSchedule,
    meals, setMeals,
    dayStatus, setDayStatus,
    actualMinutes, setActualMinutes,
    mealsLogged, setMealsLogged,
    multiWeekPlan, setMultiWeekPlan,
    currentWeekIndex, setCurrentWeekIndex,
  } = usePersistence(weekStart, user);

  // ── Local UI state ──
  const [tab, setTab] = useState('study');
  const [clarifications, setClarifications] = useState({ study: [], gym: [] });
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apply a specific week from a multi-week plan object to active state
  const applyMultiWeekData = useCallback((parsedPlan, targetWeekIdx, activeTab) => {
    if (!parsedPlan || !parsedPlan.weeks || parsedPlan.weeks.length === 0) return;

    const weekData = parsedPlan.weeks[targetWeekIdx] || parsedPlan.weeks[0];

    if (activeTab === 'study') {
      setSchedule((prev) => ({ ...prev, study: weekData.tasks || [] }));
    } else {
      setSchedule((prev) => ({ ...prev, gym: weekData.workouts || [] }));
      setMeals(weekData.meals || []);
    }
  }, [setSchedule, setMeals]);

  // ── Actions ──
  const handleParse = useCallback(async () => {
    const text = rawText[tab];
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    try {
      const parsed = await parsePlan(tab, text);

      if (parsed.weeks && parsed.weeks.length > 0) {
        // Multi-week plan parsed
        setMultiWeekPlan((prev) => ({ ...prev, [tab]: parsed }));
        setCurrentWeekIndex((prev) => ({ ...prev, [tab]: 0 }));
        applyMultiWeekData(parsed, 0, tab);
      } else if (tab === 'study') {
        setSchedule((prev) => ({ ...prev, study: parsed.tasks || [] }));
      } else {
        setSchedule((prev) => ({ ...prev, gym: parsed.workouts || [] }));
        setMeals(parsed.meals || []);
      }

      setClarifications((prev) => ({
        ...prev,
        [tab]: parsed.clarifications || [],
      }));
      setClarificationAnswers({});
    } catch (err) {
      setError(err.message || "Couldn't read that plan. Try listing clearer days and times.");
    } finally {
      setLoading(false);
    }
  }, [rawText, tab, setSchedule, setMeals, setMultiWeekPlan, setCurrentWeekIndex, applyMultiWeekData]);

  const handleRefine = useCallback(async () => {
    const qs = clarifications[tab] || [];
    if (qs.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const parsed = await refinePlan(
        tab,
        rawText[tab],
        qs,
        clarificationAnswers
      );

      if (parsed.weeks && parsed.weeks.length > 0) {
        setMultiWeekPlan((prev) => ({ ...prev, [tab]: parsed }));
        setCurrentWeekIndex((prev) => ({ ...prev, [tab]: 0 }));
        applyMultiWeekData(parsed, 0, tab);
      } else if (tab === 'study') {
        setSchedule((prev) => ({ ...prev, study: parsed.tasks || [] }));
      } else {
        setSchedule((prev) => ({ ...prev, gym: parsed.workouts || [] }));
        setMeals(parsed.meals || []);
      }

      setClarifications((prev) => ({
        ...prev,
        [tab]: parsed.clarifications || [],
      }));
    } catch (err) {
      setError(err.message || "Couldn't refine that plan.");
    } finally {
      setLoading(false);
    }
  }, [clarifications, tab, rawText, clarificationAnswers, setSchedule, setMeals, setMultiWeekPlan, setCurrentWeekIndex, applyMultiWeekData]);

  // Week navigation callbacks
  const handlePrevWeek = useCallback(() => {
    const plan = multiWeekPlan[tab];
    const curIdx = currentWeekIndex[tab] || 0;
    if (!plan || curIdx <= 0) return;

    const newIdx = curIdx - 1;
    setCurrentWeekIndex((prev) => ({ ...prev, [tab]: newIdx }));
    applyMultiWeekData(plan, newIdx, tab);
  }, [multiWeekPlan, currentWeekIndex, tab, setCurrentWeekIndex, applyMultiWeekData]);

  const handleNextWeek = useCallback(() => {
    const plan = multiWeekPlan[tab];
    const curIdx = currentWeekIndex[tab] || 0;
    if (!plan || !plan.weeks || curIdx >= plan.weeks.length - 1) return;

    const newIdx = curIdx + 1;
    setCurrentWeekIndex((prev) => ({ ...prev, [tab]: newIdx }));
    applyMultiWeekData(plan, newIdx, tab);
  }, [multiWeekPlan, currentWeekIndex, tab, setCurrentWeekIndex, applyMultiWeekData]);

  const cycleStatus = useCallback(
    (key) => {
      setDayStatus((prev) => {
        const cur = prev[key] || 'study';
        const next =
          cur === 'study' ? 'off' : cur === 'off' ? 'holiday' : 'study';
        return { ...prev, [key]: next };
      });
    },
    [setDayStatus]
  );

  const quickToggle = useCallback(
    (id, planned) => {
      setActualMinutes((prev) => {
        const cur = Number(prev[id]) || 0;
        return { ...prev, [id]: cur > 0 ? 0 : planned };
      });
    },
    [setActualMinutes]
  );

  const handleActualChange = useCallback(
    (id, value) => {
      setActualMinutes((prev) => ({ ...prev, [id]: value }));
    },
    [setActualMinutes]
  );

  const handleMealToggle = useCallback(
    (id) => {
      setMealsLogged((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    [setMealsLogged]
  );

  const handleRawTextChange = useCallback(
    (text) => {
      setRawText((prev) => ({ ...prev, [tab]: text }));
    },
    [tab, setRawText]
  );

  const handleAnswerChange = useCallback(
    (question, value) => {
      setClarificationAnswers((prev) => ({ ...prev, [question]: value }));
    },
    []
  );

  // ── Derived Multi-Week Data ──
  const activePlan = multiWeekPlan[tab];
  const activeWeekIdx = currentWeekIndex[tab] || 0;
  const activeWeek = activePlan && activePlan.weeks ? activePlan.weeks[activeWeekIdx] : null;
  const totalWeeks = activePlan && activePlan.weeks ? activePlan.weeks.length : 0;

  // Determine current phase based on active week number
  const currentPhase = useMemo(() => {
    if (!activePlan || !activePlan.phases || !activeWeek) return null;
    const weekNum = activeWeek.weekNumber || (activeWeekIdx + 1);
    return activePlan.phases.find(
      (p) => weekNum >= p.startWeek && weekNum <= p.endWeek
    ) || activePlan.phases[0] || null;
  }, [activePlan, activeWeek, activeWeekIdx]);

  // ── Derived Task Data ──
  const allTasks = useMemo(
    () => [
      ...schedule.study.map((t, i) => ({ ...t, kind: 'study', id: `study-${i}` })),
      ...schedule.gym.map((t, i) => ({ ...t, kind: 'gym', id: `gym-${i}` })),
    ],
    [schedule]
  );

  const chartData = useMemo(
    () =>
      WEEKDAYS.map((day) => {
        const dayTasks = allTasks.filter((t) => t.day === day);
        const planned = dayTasks.reduce(
          (s, t) => s + (Number(t.duration) || 0),
          0
        );
        const completed = dayTasks.reduce(
          (s, t) => s + (Number(actualMinutes[t.id]) || 0),
          0
        );
        return { day: day.slice(0, 3), planned, completed };
      }),
    [allTasks, actualMinutes]
  );

  const totalPlannedMin = allTasks.reduce(
    (s, t) => s + (Number(t.duration) || 0),
    0
  );
  const totalDoneMin = allTasks.reduce(
    (s, t) => s + (Number(actualMinutes[t.id]) || 0),
    0
  );
  const completionPct =
    totalPlannedMin > 0
      ? Math.round((totalDoneMin / totalPlannedMin) * 100)
      : 0;

  const activeTasks = schedule[tab].map((t, i) => ({
    ...t,
    kind: tab,
    id: `${tab}-${i}`,
  }));

  const tasksByDay = WEEKDAYS.map((day) => ({
    day,
    items: activeTasks.filter((t) => t.day === day),
    meals:
      tab === 'gym'
        ? meals.map((m, i) => ({ ...m, id: `meal-${i}` })).filter((m) => m.day === day)
        : [],
  })).filter((g) => g.items.length > 0 || g.meals.length > 0);

  const hasParsed = schedule.study.length > 0 || schedule.gym.length > 0 || totalWeeks > 0;

  // ── Render ──
  return (
    <div className="cadence-app">
      <AuthBar user={user} />
      <Header weekStart={weekStart} />

      <PlanInput
        tab={tab}
        setTab={setTab}
        rawText={rawText[tab]}
        onRawTextChange={handleRawTextChange}
        onParse={handleParse}
        loading={loading}
        error={error}
      />

      <Clarifications
        clarifications={clarifications[tab]}
        answers={clarificationAnswers}
        onAnswerChange={handleAnswerChange}
        onRefine={handleRefine}
        loading={loading}
      />

      {totalWeeks > 1 && (
        <WeekNavigator
          currentWeekIndex={activeWeekIdx}
          totalWeeks={totalWeeks}
          currentWeekTitle={activeWeek?.title}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      )}

      {currentPhase && <PhaseBanner currentPhase={currentPhase} />}

      <WeekStrip
        weekDates={weekDates}
        dayStatus={dayStatus}
        onCycleStatus={cycleStatus}
      />

      <TaskList
        tasksByDay={tasksByDay}
        weekDates={weekDates}
        dayStatus={dayStatus}
        actualMinutes={actualMinutes}
        mealsLogged={mealsLogged}
        onQuickToggle={quickToggle}
        onActualChange={handleActualChange}
        onMealToggle={handleMealToggle}
      />

      <SummaryCards
        totalPlannedMin={totalPlannedMin}
        completionPct={completionPct}
      />

      <ProgressChart chartData={chartData} />

      <InfoFooter />

      {hasParsed && (
        <NotificationBanner
          isSupported={pushSupported}
          isSubscribed={pushSubscribed}
          onSubscribe={pushSubscribe}
        />
      )}
    </div>
  );
}
