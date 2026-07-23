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
import Navbar from './components/Navbar';
import ThemeSelector from './components/ThemeSelector';
import TodayView from './components/TodayView';
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
import PomodoroTimer from './components/PomodoroTimer';
import ExcelGoalsSheet from './components/ExcelGoalsSheet';

export default function App() {
  const { weekStart, weekDates, dateKey } = useWeekDates();

  // ── View mode state (defaults to 'today') ──
  const [viewMode, setViewMode] = useState('today');

  // ── Auth state (Supabase) ──
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
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
  } = usePersistence(weekStart, user);

  // Sync active theme with document body data-theme attribute
  useEffect(() => {
    document.body.setAttribute('data-theme', theme || 'paper');
  }, [theme]);

  // ── Local UI state ──
  const [tab, setTab] = useState(categories[0]?.id || 'skill');
  const [clarifications, setClarifications] = useState({});
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update status handler for TodayView / TaskList
  const handleUpdateTaskStatus = useCallback((id, status) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        status,
      },
    }));
  }, [setTaskStatuses]);

  // Update task note/assignment handler
  const handleUpdateTaskNote = useCallback((id, note) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        note,
      },
    }));
  }, [setTaskStatuses]);

  // Apply a specific week from a multi-week plan object to active state
  const applyMultiWeekData = useCallback((parsedPlan, targetWeekIdx, activeTab) => {
    if (!parsedPlan || !parsedPlan.weeks || parsedPlan.weeks.length === 0) return;

    const weekData = parsedPlan.weeks[targetWeekIdx] || parsedPlan.weeks[0];

    if (activeTab === 'gym') {
      setSchedule((prev) => ({ ...prev, gym: weekData.workouts || [] }));
      setMeals(weekData.meals || []);
    } else {
      setSchedule((prev) => ({ ...prev, [activeTab]: weekData.tasks || [] }));
    }
  }, [setSchedule, setMeals]);

  // ── Actions ──
  const handleParse = useCallback(async () => {
    const text = rawText[tab];
    if (!text || !text.trim()) return;

    setLoading(true);
    setError('');
    try {
      const parseTab = tab === 'gym' ? 'gym' : 'study';
      const parsed = await parsePlan(parseTab, text);

      if (parsed.weeks && parsed.weeks.length > 0) {
        setMultiWeekPlan((prev) => ({ ...prev, [tab]: parsed }));
        setCurrentWeekIndex((prev) => ({ ...prev, [tab]: 0 }));
        applyMultiWeekData(parsed, 0, tab);
      } else if (tab === 'gym') {
        setSchedule((prev) => ({ ...prev, gym: parsed.workouts || [] }));
        setMeals(parsed.meals || []);
      } else {
        setSchedule((prev) => ({ ...prev, [tab]: parsed.tasks || [] }));
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
      const parseTab = tab === 'gym' ? 'gym' : 'study';
      const parsed = await refinePlan(
        parseTab,
        rawText[tab],
        qs,
        clarificationAnswers
      );

      if (parsed.weeks && parsed.weeks.length > 0) {
        setMultiWeekPlan((prev) => ({ ...prev, [tab]: parsed }));
        setCurrentWeekIndex((prev) => ({ ...prev, [tab]: 0 }));
        applyMultiWeekData(parsed, 0, tab);
      } else if (tab === 'gym') {
        setSchedule((prev) => ({ ...prev, gym: parsed.workouts || [] }));
        setMeals(parsed.meals || []);
      } else {
        setSchedule((prev) => ({ ...prev, [tab]: parsed.tasks || [] }));
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
        const next = cur === 'study' ? 'off' : cur === 'off' ? 'holiday' : 'study';
        return { ...prev, [key]: next };
      });
    },
    [setDayStatus]
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

  const currentPhase = useMemo(() => {
    if (!activePlan || !activePlan.phases || !activeWeek) return null;
    const weekNum = activeWeek.weekNumber || (activeWeekIdx + 1);
    return activePlan.phases.find(
      (p) => weekNum >= p.startWeek && weekNum <= p.endWeek
    ) || activePlan.phases[0] || null;
  }, [activePlan, activeWeek, activeWeekIdx]);

  // ── Derived Task Data ──
  const allTasks = useMemo(() => {
    const result = [];
    categories.forEach((cat) => {
      (schedule[cat.id] || []).forEach((t, i) => {
        result.push({ ...t, kind: cat.id, id: `${cat.id}-${i}` });
      });
    });
    return result;
  }, [categories, schedule]);

  const chartData = useMemo(
    () =>
      WEEKDAYS.map((day) => {
        const dayTasks = allTasks.filter((t) => t.day === day);
        const planned = dayTasks.reduce(
          (s, t) => s + (Number(t.duration) || 0),
          0
        );
        const completed = dayTasks.reduce(
          (s, t) => s + (taskStatuses[t.id]?.status === 'done' ? Number(t.duration) || 0 : 0),
          0
        );
        return { day: day.slice(0, 3), planned, completed };
      }),
    [allTasks, taskStatuses]
  );

  const totalPlannedMin = allTasks.reduce(
    (s, t) => s + (Number(t.duration) || 0),
    0
  );
  const totalDoneMin = allTasks.reduce(
    (s, t) => s + (taskStatuses[t.id]?.status === 'done' ? Number(t.duration) || 0 : 0),
    0
  );
  const completionPct =
    totalPlannedMin > 0
      ? Math.round((totalDoneMin / totalPlannedMin) * 100)
      : 0;

  const activeTasks = (schedule[tab] || []).map((t, i) => ({
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

  const hasParsed = allTasks.length > 0 || totalWeeks > 0;

  const legacyActualMinutes = useMemo(() => {
    const map = {};
    Object.entries(taskStatuses).forEach(([id, st]) => {
      if (st.status === 'done') map[id] = 90;
    });
    return map;
  }, [taskStatuses]);

  const quickToggle = useCallback((id, planned) => {
    setTaskStatuses((prev) => {
      const cur = prev[id]?.status || 'pending';
      return { ...prev, [id]: { status: cur === 'done' ? 'pending' : 'done' } };
    });
  }, [setTaskStatuses]);

  const handleActualChange = useCallback((id, value) => {
    setTaskStatuses((prev) => ({ ...prev, [id]: { status: Number(value) > 0 ? 'done' : 'pending' } }));
  }, [setTaskStatuses]);

  const handleMealToggle = useCallback((id) => {
    setTaskStatuses((prev) => {
      const cur = prev[id]?.status || 'pending';
      return { ...prev, [id]: { status: cur === 'done' ? 'pending' : 'done' } };
    });
  }, [setTaskStatuses]);

  return (
    <div className="cadence-app">
      <AuthBar user={user} />
      <Header weekStart={weekStart} />
      <ThemeSelector activeTheme={theme} onSelectTheme={setTheme} />
      <Navbar activeView={viewMode} onViewChange={setViewMode} />

      {/* 1. TODAY VIEW (Landing Screen) */}
      {viewMode === 'today' && (
        <TodayView
          weekDates={weekDates}
          dayStatus={dayStatus}
          categories={categories}
          schedule={schedule}
          meals={meals}
          taskStatuses={taskStatuses}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onUpdateTaskNote={handleUpdateTaskNote}
          onNavigateToWeek={() => setViewMode('week')}
        />
      )}

      {/* 2. WEEK VIEW (Full Schedule) */}
      {viewMode === 'week' && (
        <>
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
            actualMinutes={legacyActualMinutes}
            mealsLogged={{}}
            onQuickToggle={quickToggle}
            onActualChange={handleActualChange}
            onMealToggle={handleMealToggle}
          />

          <SummaryCards
            totalPlannedMin={totalPlannedMin}
            completionPct={completionPct}
          />

          <ProgressChart chartData={chartData} />
        </>
      )}

      {/* 3. GOALS VIEW (Excel-Style Goal Sheet) */}
      {viewMode === 'goals' && (
        <ExcelGoalsSheet goals={goals} onUpdateGoals={setGoals} />
      )}

      {/* 4. FOCUS VIEW (Pomodoro Timer) */}
      {viewMode === 'focus' && (
        <PomodoroTimer />
      )}

      {/* 5. SETUP VIEW (AI Plan Parser & Custom Categories) */}
      {viewMode === 'setup' && (
        <>
          <PlanInput
            tab={tab}
            setTab={setTab}
            categories={categories}
            onSaveCategories={setCategories}
            rawText={rawText[tab] || ''}
            onRawTextChange={handleRawTextChange}
            onParse={handleParse}
            loading={loading}
            error={error}
          />

          <Clarifications
            clarifications={clarifications[tab] || []}
            answers={clarificationAnswers}
            onAnswerChange={handleAnswerChange}
            onRefine={handleRefine}
            loading={loading}
          />
        </>
      )}

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
