import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
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
import NotesVault from './components/NotesVault';
import OnboardingWizardModal from './components/OnboardingWizardModal';
import CopilotDrawer from './components/CopilotDrawer';
import { useTaskNotifications } from './hooks/useTaskNotifications';
import ExcelGoalsSheet from './components/ExcelGoalsSheet';
import GuidedTour from './components/GuidedTour';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { weekStart, weekDates, dateKey } = useWeekDates();

  // ── View mode state (defaults to 'today') ──
  const [viewMode, setViewMode] = useState('today');
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Auto-launch Onboarding Wizard on First Visit
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('cadence_onboarded_v2');
    if (!hasOnboarded) {
      setIsOnboardingOpen(true);
    }
  }, []);

  const handleCloseTour = useCallback(() => {
    setIsTourOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
  }, []);

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
    streak, setStreak,
    sleepSchedule, setSleepSchedule,
    macros, setMacros,
    muscleFocus, setMuscleFocus,
    focusLogs, setFocusLogs,
    subjectRegistry, setSubjectRegistry,
    weeklyReflection, setWeeklyReflection,
    semesterConfig, setSemesterConfig,
    sleepLogs, setSleepLogs,
  } = usePersistence(weekStart, user);

  // Sync active theme with document body data-theme attribute
  useEffect(() => {
    document.body.setAttribute('data-theme', theme || 'paper');
  }, [theme]);

  // Client-side task reminder notification scheduler
  const { requestNotificationPermission } = useTaskNotifications(schedule, categories);

  const handleSaveOnboarding = useCallback((data) => {
    if (data.selectedTheme) setTheme(data.selectedTheme);
    if (data.sleepTimes) setSleepSchedule(data.sleepTimes);
    if (data.restDays && data.restDays.length > 0) {
      setDayStatus((prev) => {
        const nextStatus = { ...prev };
        WEEKDAYS.forEach((day) => {
          if (data.restDays.includes(day)) {
            nextStatus[day] = 'off';
          }
        });
        return nextStatus;
      });
    }
  }, [setTheme, setSleepSchedule, setDayStatus]);

  const handleFocusSessionComplete = useCallback((mins, catId = 'skill') => {
    setFocusLogs((prev) => ({
      ...prev,
      [catId]: (prev[catId] || 0) + mins,
    }));
  }, [setFocusLogs]);

  // ── Local UI state ──
  const [tab, setTab] = useState(categories[0]?.id || 'skill');
  const [clarifications, setClarifications] = useState({});
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parseSuccess, setParseSuccess] = useState(null);
  const parseSuccessTimer = useRef(null);

  // Clear parseSuccess when switching category tabs
  useEffect(() => {
    setParseSuccess(null);
  }, [tab]);

  const handleClearCategorySchedule = useCallback((catId) => {
    setSchedule((prev) => ({ ...prev, [catId]: [] }));
    setRawText((prev) => ({ ...prev, [catId]: '' }));
    if (catId === 'gym' || catId === 'health') {
      setMeals([]);
    }
    setParseSuccess(null);
  }, [setSchedule, setRawText, setMeals]);

  const handleClearAllSchedules = useCallback(() => {
    const emptySched = {};
    const emptyRaw = {};
    (categories || []).forEach((cat) => {
      emptySched[cat.id] = [];
      emptyRaw[cat.id] = '';
    });
    setSchedule(emptySched);
    setRawText(emptyRaw);
    setMeals([]);
    setTaskStatuses({});
    setFocusLogs({});
    setMultiWeekPlan({});
    setCurrentWeekIndex({});
    setParseSuccess(null);
  }, [categories, setSchedule, setRawText, setMeals, setTaskStatuses, setFocusLogs, setMultiWeekPlan, setCurrentWeekIndex]);

  const handleDeleteTask = useCallback((catId, index) => {
    setSchedule((prev) => {
      const catTasks = [...(prev[catId] || [])];
      catTasks.splice(index, 1);
      return { ...prev, [catId]: catTasks };
    });
  }, [setSchedule]);

  // Auto-increment streak when user marks tasks done
  const handleUpdateTaskStatus = useCallback((id, status) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        status,
      },
    }));

    if (status === 'done') {
      setStreak((prev) => Math.max(prev, 1));
    }
  }, [setTaskStatuses, setStreak]);

  // Update task note/assignment handler
  const handleUpdateTaskNote = useCallback((id, note, deadline = undefined) => {
    setTaskStatuses((prev) => {
      const updated = {
        ...(prev[id] || {}),
        note,
      };
      if (deadline !== undefined) {
        updated.deadline = deadline;
      }
      return {
        ...prev,
        [id]: updated,
      };
    });
  }, [setTaskStatuses]);

  // Inline edit handler for Start Time & Duration
  const handleUpdateTaskTime = useCallback((categoryKey, taskIndex, newStart, newDuration) => {
    setSchedule((prev) => {
      const list = [...(prev[categoryKey] || [])];
      if (list[taskIndex]) {
        list[taskIndex] = {
          ...list[taskIndex],
          start: newStart,
          duration: newDuration,
        };
      }
      return { ...prev, [categoryKey]: list };
    });
  }, [setSchedule]);

  // Manual Task Adder Handler
  const handleAddTaskManual = useCallback((categoryKey, newTask) => {
    setSchedule((prev) => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] || []), newTask],
    }));
  }, [setSchedule]);

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
    if (!text || !text.trim() || text.trim().length < 3) return;

    setLoading(true);
    setError('');
    setParseSuccess(null);
    try {
      const parseTab = tab === 'gym' ? 'gym' : 'study';
      const parsed = await parsePlan(parseTab, text);
      let count = 0;

      if (parsed.weeks && parsed.weeks.length > 0) {
        setMultiWeekPlan((prev) => ({ ...prev, [tab]: parsed }));
        setCurrentWeekIndex((prev) => ({ ...prev, [tab]: 0 }));
        applyMultiWeekData(parsed, 0, tab);
        count = (parsed.weeks[0]?.tasks || []).length;
      } else if (tab === 'gym') {
        const workouts = parsed.workouts || [];
        setSchedule((prev) => ({ ...prev, gym: workouts }));
        setMeals(parsed.meals || []);
        count = workouts.length;
      } else {
        const rawTasks = parsed.tasks || [];
        const registryForTab = subjectRegistry[tab] || [];
        const tasks = rawTasks.map((t) => {
          const titleLower = String(t.title || '').toLowerCase();
          
          // ── STAGE E TIEBREAK PRIORITY RULE ──
          // Priority 1: Registered Subject Match
          let matched = registryForTab.find((subj) => {
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
            ...t,
            subjectId: matched ? matched.id : null,
          };
        });
        setSchedule((prev) => ({ ...prev, [tab]: tasks }));
        count = tasks.length;
      }

      const catObj = categories.find((c) => c.id === tab);
      const successObj = {
        catId: tab,
        count,
        categoryLabel: catObj?.label || tab,
        timestamp: Date.now(),
      };
      setParseSuccess(successObj);

      if (parseSuccessTimer.current) clearTimeout(parseSuccessTimer.current);
      parseSuccessTimer.current = setTimeout(() => {
        setParseSuccess(null);
      }, 6000);

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
  }, [rawText, tab, setSchedule, setMeals, setMultiWeekPlan, setCurrentWeekIndex, applyMultiWeekData, categories]);

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
    (key, dayName) => {
      setDayStatus((prev) => {
        const cur = prev[key] || (dayName ? prev[dayName] : 'study') || 'study';
        const next = cur === 'study' ? 'off' : cur === 'off' ? 'holiday' : 'study';

        const updated = { ...prev, [key]: next };
        if (dayName) {
          updated[dayName] = next;
          updated[`study-${dayName}`] = next;
          updated[`skill-${dayName}`] = next;
          updated[`college-${dayName}`] = next;
          updated[`gym-${dayName}`] = next;
        }
        return updated;
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
        result.push({ ...t, kind: cat.id, id: `${cat.id}-${t.day}-${i}` });
      });
    });
    return result;
  }, [categories, schedule]);

  const chartData = useMemo(
    () =>
      WEEKDAYS.map((day) => {
        const dayTasks = allTasks.filter(
          (t) => t.day === day || (t.day && t.day.toLowerCase().startsWith(day.slice(0, 3).toLowerCase()))
        );
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

  const activeTasks = (schedule[tab] || schedule['skill'] || schedule['gym'] || []).map((t, i) => ({
    ...t,
    kind: tab,
    id: `${tab}-${t.day}-${i}`,
  }));

  const safeMeals = Array.isArray(meals) ? meals : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const tasksByDay = WEEKDAYS.map((day) => ({
    day,
    items: activeTasks.filter(
      (t) => t.day === day || (t.day && t.day.toLowerCase().startsWith(day.slice(0, 3).toLowerCase()))
    ),
    meals:
      tab === 'gym'
        ? safeMeals.map((m, i) => ({ ...m, id: `meal-${i}` })).filter(
            (m) => m.day === day || (m.day && m.day.toLowerCase().startsWith(day.slice(0, 3).toLowerCase()))
          )
        : [],
  })).filter((g) => g.items.length > 0 || g.meals.length > 0);

  const hasParsed = allTasks.length > 0 || totalWeeks > 0;

  const legacyActualMinutes = useMemo(() => {
    const map = {};
    Object.entries(taskStatuses).forEach(([id, st]) => {
      if (st.actualMinutes !== undefined) {
        map[id] = st.actualMinutes;
      }
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
    <ErrorBoundary>
      <div className="cadence-app">
        <AuthBar user={user} />
        <Header
          weekStart={weekStart}
          activeTheme={theme}
          onSelectTheme={setTheme}
          onStartTour={() => setIsTourOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          streak={streak}
        />

        {/* 1. TODAY VIEW (Landing Screen) */}
        {viewMode === 'today' && (
          <TodayView
            user={user}
            weekDates={weekDates}
            dayStatus={dayStatus}
            categories={categories}
            schedule={schedule}
            meals={meals}
            taskStatuses={taskStatuses}
            subjectRegistry={subjectRegistry}
            sleepSchedule={sleepSchedule}
            sleepLogs={sleepLogs}
            onUpdateSleepLogs={setSleepLogs}
            macros={macros}
            onUpdateMacros={setMacros}
            muscleFocus={muscleFocus}
            onUpdateMuscleFocus={setMuscleFocus}
            onUpdateSleepSchedule={setSleepSchedule}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onUpdateTaskNote={handleUpdateTaskNote}
            onUpdateTaskTime={handleUpdateTaskTime}
            onCycleStatus={cycleStatus}
            onNavigateToWeek={() => setViewMode('setup')}
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

            <div className="week-view-header-actions" style={{ marginBottom: '1.5rem' }}>
              <WeekStrip
                weekDates={weekDates}
                dayStatus={dayStatus}
                onCycleStatus={cycleStatus}
                schedule={schedule}
                taskStatuses={taskStatuses}
                subjectRegistry={subjectRegistry}
                categories={categories}
                weeklyReflection={weeklyReflection}
                onUpdateWeeklyReflection={setWeeklyReflection}
                semesterConfig={semesterConfig}
              />
              <button
                className="cadence-btn cadence-btn--primary"
                onClick={() => setViewMode('setup')}
                style={{ height: '44px', gap: '8px', width: '100%', marginTop: '4px' }}
              >
                <Plus size={16} />
                <span>Parse Plan / Add Task</span>
              </button>
            </div>

            <TaskList
              tasksByDay={tasksByDay}
              weekDates={weekDates}
              dayStatus={dayStatus}
              taskStatuses={taskStatuses}
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

        {/* 3. GOALS / MONTH VIEW (User Targets & Completion Tracking) */}
        {viewMode === 'goals' && (
          <ExcelGoalsSheet
            goals={goals}
            onUpdateGoals={setGoals}
            categories={categories}
            schedule={schedule}
            taskStatuses={taskStatuses}
            dayStatus={dayStatus}
            focusLogs={focusLogs}
          />
        )}

        {/* 4. NOTES VAULT & MONTHLY ARCHIVE VIEW */}
        {viewMode === 'notes' && (
          <NotesVault
            categories={categories}
            schedule={schedule}
            taskStatuses={taskStatuses}
            onUpdateTaskNote={handleUpdateTaskNote}
          />
        )}

        {/* 4. FOCUS VIEW (Pomodoro Timer) */}
        {viewMode === 'focus' && (
          <PomodoroTimer onFocusSessionComplete={handleFocusSessionComplete} />
        )}

        {/* 4. SETUP VIEW (AI Plan Parser & Manual Task Builder) */}
        {viewMode === 'setup' && (
          <>
            <PlanInput
              tab={tab}
              setTab={setTab}
              categories={categories}
              onSaveCategories={setCategories}
              schedule={schedule}
              rawText={rawText[tab] || ''}
              onRawTextChange={handleRawTextChange}
              onParse={handleParse}
              onClearCategorySchedule={handleClearCategorySchedule}
              onClearAllSchedules={handleClearAllSchedules}
              onDeleteTask={handleDeleteTask}
              onNavigateToWeek={() => setViewMode('week')}
              parseSuccess={parseSuccess}
              onDismissParseSuccess={() => setParseSuccess(null)}
              onAddTaskManual={handleAddTaskManual}
              loading={loading}
              error={error}
              subjectRegistry={subjectRegistry}
              onUpdateSubjectRegistry={setSubjectRegistry}
              semesterConfig={semesterConfig}
              onUpdateSemesterConfig={setSemesterConfig}
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

        <InfoFooter viewMode={viewMode} />

        <NotificationBanner
          isSupported={pushSupported || (typeof window !== 'undefined' && 'Notification' in window)}
          isSubscribed={pushSubscribed}
          onSubscribe={async () => {
            if (requestNotificationPermission) await requestNotificationPermission();
            if (pushSubscribe) await pushSubscribe();
          }}
        />

        {/* Interactive Spotlight Tour */}
        <GuidedTour
          isOpen={isTourOpen}
          onClose={handleCloseTour}
          onViewChange={setViewMode}
        />

        <OnboardingWizardModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          initialName={localStorage.getItem('cadence_user_name') || ''}
          initialTheme={theme}
          initialSleep={sleepSchedule}
          onSaveOnboarding={handleSaveOnboarding}
        />

        <CopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          user={user}
          schedule={schedule}
          onUpdateSchedule={setSchedule}
          subjectRegistry={subjectRegistry}
          taskStatuses={taskStatuses}
          focusLogs={focusLogs}
          semesterConfig={semesterConfig}
          sleepLogs={sleepLogs}
          onUpdateSleepLogs={setSleepLogs}
        />

        {/* Dintaal Bottom Navigation Dock */}
        <Navbar activeView={viewMode} onViewChange={setViewMode} />
      </div>
    </ErrorBoundary>
  );
}
