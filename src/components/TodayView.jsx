import React, { useState, useEffect } from 'react';
import { Clock, CalendarOff, Coffee, Check, Minus, X, Hourglass, Zap, FileText, GraduationCap, LayoutGrid, CheckCircle2, Edit2, Eye, EyeOff, RotateCw, Moon, Sparkles, BedDouble } from 'lucide-react';
import { WEEKDAYS, STATUS_STYLE } from '../utils/constants';
import { dateKey } from '../utils/dateUtils';
import CollegeOverviewModal from './CollegeOverviewModal';
import BeatStrip from './BeatStrip';

export default function TodayView({
  weekDates,
  dayStatus,
  categories,
  schedule,
  meals,
  taskStatuses,
  sleepSchedule,
  macros,
  onUpdateMacros,
  muscleFocus,
  onUpdateMuscleFocus,
  onUpdateSleepSchedule,
  onUpdateTaskStatus,
  onUpdateTaskNote,
  onUpdateTaskTime,
  onCycleStatus,
  onNavigateToWeek,
}) {
  // Live Clock State
  const [now, setNow] = useState(new Date());
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [editingTimeId, setEditingTimeId] = useState(null);
  const [editStart, setEditStart] = useState('10:00');
  const [editDuration, setEditDuration] = useState('60');
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [showTasksOnRestDay, setShowTasksOnRestDay] = useState(false);
  const [isEditingSleep, setIsEditingSleep] = useState(false);

  // Editing Macros State
  const [editingMacros, setEditingMacros] = useState(false);
  const [macroInput, setMacroInput] = useState(macros || {
    proteinTaken: 120, proteinTarget: 150,
    carbsTaken: 180, carbsTarget: 220,
    fatsTaken: 45, fatsTarget: 60,
  });

  const handleToggleMuscle = (muscle) => {
    if (!onUpdateMuscleFocus) return;
    const current = muscleFocus || [];
    if (current.includes(muscle)) {
      onUpdateMuscleFocus(current.filter((m) => m !== muscle));
    } else {
      onUpdateMuscleFocus([...current, muscle]);
    }
  };

  const handleSaveMacros = () => {
    if (onUpdateMacros) {
      onUpdateMacros(macroInput);
    }
    setEditingMacros(false);
  };
  const [sleepStartInput, setSleepStartInput] = useState(sleepSchedule?.sleepStart || '23:30');
  const [sleepEndInput, setSleepEndInput] = useState(sleepSchedule?.sleepEnd || '07:00');
  const [dismissLateNightPopup, setDismissLateNightPopup] = useState(false);
  const [dismissFreeTimePopup, setDismissFreeTimePopup] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const dayIndex = (now.getDay() + 6) % 7; // Mon=0..Sun=6
  const todayName = WEEKDAYS[dayIndex];
  const dateObj = weekDates[dayIndex] || now;

  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Robust Status Lookup (checks YYYY-MM-DD dateKey, weekday name, and legacy study-weekday)
  const dk = dateKey(dateObj);
  const statusType =
    dayStatus[dk] ||
    dayStatus[todayName] ||
    dayStatus[`study-${todayName}`] ||
    dayStatus[`skill-${todayName}`] ||
    dayStatus[`college-${todayName}`] ||
    'study';

  const statusStyle = STATUS_STYLE[statusType] || STATUS_STYLE.study;

  // Group tasks dynamically by custom categories
  const categorySections = categories.map((cat) => {
    const tasks = (schedule[cat.id] || [])
      .filter((t) => !t.day || t.day === todayName || t.day.toLowerCase().startsWith(todayName.slice(0, 3).toLowerCase()))
      .map((t, i) => ({ ...t, kind: cat.id, indexInCat: i, id: `${cat.id}-${i}` }))
      .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

    return {
      ...cat,
      tasks,
    };
  });

  // Today Meals
  const todayMeals = (Array.isArray(meals) ? meals : [])
    .filter((m) => m.day === todayName)
    .map((m, i) => ({
      id: `meal-${i}`,
      kind: 'meal',
      title: m.name,
      start: m.time || '12:00',
      duration: 20,
      calories: m.calories,
      protein: m.protein,
    }))
    .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

  const allToday = [
    ...categorySections.flatMap((sec) => sec.tasks),
    ...todayMeals,
  ].sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

  const totalTasks = allToday.length;

  // ── Calculate Next / Active Task ──
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let activeTask = null;
  let nextTask = null;
  let minutesUntilNext = null;

  for (const task of allToday) {
    if (!task || !task.start || typeof task.start !== 'string') continue;
    const parts = task.start.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const startMins = h * 60 + m;
    const duration = Number(task.duration) || 30;
    const endMins = startMins + duration;

    if (nowMinutes >= startMins && nowMinutes < endMins) {
      activeTask = { ...task, remainingMins: endMins - nowMinutes };
      break;
    }

    if (startMins > nowMinutes) {
      nextTask = task;
      minutesUntilNext = startMins - nowMinutes;
      break;
    }
  }

  // Sleep Duration Calculator (Robust & Defensive Parsing)
  const sleepStartStr = (sleepSchedule && typeof sleepSchedule.sleepStart === 'string') ? sleepSchedule.sleepStart : '23:30';
  const sleepEndStr = (sleepSchedule && typeof sleepSchedule.sleepEnd === 'string') ? sleepSchedule.sleepEnd : '07:00';
  
  const bedParts = sleepStartStr.split(':').map(Number);
  const wakeParts = sleepEndStr.split(':').map(Number);
  
  let bedH = bedParts[0] ?? 23;
  const bedM = bedParts[1] ?? 30;
  let wakeH = wakeParts[0] ?? 7;
  const wakeM = wakeParts[1] ?? 0;

  // Fix 12:xx AM 24-hour hour ambiguity: when bedtime is entered as 12:xx (12:30 AM midnight) and wake time is morning
  if (bedH === 12 && wakeH < 12) {
    bedH = 0; // Normalize 12:xx AM to 00:xx
  }

  let sleepMins = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
  if (sleepMins <= 0) sleepMins += 24 * 60; // overnight math
  if (sleepMins > 16 * 60) sleepMins = 24 * 60 - sleepMins; // defensive cap for 12/00 hour rollover
  const sleepHours = (sleepMins / 60).toFixed(1);

  // Late-Night Detector (e.g. past bedtime 23:30 or before 5am)
  const isLateNight = (now.getHours() >= 23 || now.getHours() < 5) && !dismissLateNightPopup;
  const isFreeTime = !activeTask && totalTasks > 0 && !dismissFreeTimePopup && !isLateNight;

  // ── Calculate Escalating Deadlines ──
  const upcomingDeadlines = Object.keys(taskStatuses)
    .filter(id => taskStatuses[id]?.deadline && taskStatuses[id]?.status !== 'done')
    .map(id => ({
      id,
      deadline: new Date(taskStatuses[id].deadline),
      note: taskStatuses[id].note
    }))
    .filter(t => t.deadline > now)
    .sort((a, b) => a.deadline - b.deadline);

  const closestDeadline = upcomingDeadlines[0];
  let deadlineNudge = null;
  
  if (closestDeadline) {
    const msLeft = closestDeadline.deadline - now;
    const hoursLeft = msLeft / (1000 * 60 * 60);

    let freeMinsToday = 0;
    const sleepStartStrLocal = sleepSchedule?.sleepStart || '23:30';
    const [ssH, ssM] = sleepStartStrLocal.split(':').map(Number);
    let endOfDayMins = ssH * 60 + ssM;
    if (endOfDayMins < 12 * 60) endOfDayMins += 24 * 60; 
    
    let currentMarker = Math.max(nowMinutes, 0); 
    
    for (const t of allToday) {
      if (!t.start) continue;
      const [h, m] = t.start.split(':').map(Number);
      const startMins = h * 60 + m;
      const duration = Number(t.duration) || 30;
      const endMins = startMins + duration;
      
      if (startMins > currentMarker && startMins < endOfDayMins) {
        freeMinsToday += (Math.min(startMins, endOfDayMins) - currentMarker);
      }
      if (endMins > currentMarker) {
        currentMarker = endMins;
      }
    }
    
    if (currentMarker < endOfDayMins) {
      freeMinsToday += (endOfDayMins - currentMarker);
    }
    
    const freeHoursLeft = (freeMinsToday / 60).toFixed(1);

    let level = 'gentle';
    let style = { background: 'var(--paper-raised)', border: '1.5px dashed var(--indigo)', color: 'var(--ink)' };
    let title = 'Assignment Upcoming';
    
    if (hoursLeft <= 4) {
      level = 'panic';
      style = { background: '#EF4444', border: '2px solid #DC2626', color: '#FFFFFF', boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)' };
      title = '🚨 BHAYANAK PANIC MODE';
    } else if (hoursLeft <= 12) {
      level = 'urgent';
      style = { background: '#F59E0B', border: '2px solid #D97706', color: '#FFFFFF', boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)' };
      title = '⚠️ Urgent Deadline';
    }
    
    deadlineNudge = {
      level, style, title, hoursLeft: hoursLeft.toFixed(1), freeHoursLeft,
      note: closestDeadline.note
    };
  }

  // Calculate metrics
  const completedTasks = allToday.filter((t) => taskStatuses[t.id]?.status === 'done').length;
  const partialTasks = allToday.filter((t) => taskStatuses[t.id]?.status === 'partial').length;
  const skippedTasks = allToday.filter((t) => taskStatuses[t.id]?.status === 'skipped').length;

  const progressPct = totalTasks > 0 ? Math.round(((completedTasks + partialTasks * 0.5) / totalTasks) * 100) : 0;

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus =
      currentStatus === 'pending'
        ? 'done'
        : currentStatus === 'done'
        ? 'partial'
        : currentStatus === 'partial'
        ? 'skipped'
        : 'pending';

    onUpdateTaskStatus(id, nextStatus);
  };

  const handleMarkAllCollegeDone = () => {
    const collegeSec = categorySections.find((s) => s.id === 'college');
    if (!collegeSec) return;
    collegeSec.tasks.forEach((t) => {
      onUpdateTaskStatus(t.id, 'done');
    });
  };

  const handleSaveSleepSchedule = () => {
    if (onUpdateSleepSchedule) {
      onUpdateSleepSchedule({ sleepStart: sleepStartInput, sleepEnd: sleepEndInput });
    }
    setIsEditingSleep(false);
  };

  const handleOpenNoteEditor = (id, existingNote, existingDeadline) => {
    setEditingNoteId(id);
    setNoteInput(existingNote || '');
    setDeadlineInput(existingDeadline || '');
  };

  const handleSaveNote = (id) => {
    onUpdateTaskNote(id, noteInput.trim(), deadlineInput.trim() || undefined);
    setEditingNoteId(null);
  };

  const handleStartEditTime = (task) => {
    setEditingTimeId(task.id);
    setEditStart(task.start || '09:00');
    setEditDuration(String(task.duration || 60));
  };

  const handleSaveTime = (task) => {
    if (onUpdateTaskTime) {
      onUpdateTaskTime(task.kind, task.indexInCat, editStart, Number(editDuration) || 30);
    }
    setEditingTimeId(null);
  };

  const renderTaskCard = (task, catColor, indexInDay = 0) => {
    const taskState = taskStatuses[task.id] || { status: 'pending', note: '' };
    const curStatus = taskState.status;
    const isDone = curStatus === 'done';
    const isSam = indexInDay === 0;
    const noteText = taskState.note || '';
    const deadline = taskState.deadline || '';
    const isEditingThisNote = editingNoteId === task.id;

    return (
      <div
        key={task.id}
        className={`dintaal-task-button ${isDone ? 'dintaal-task-button--done' : ''}`}
        onClick={() => handleToggleStatus(task.id, curStatus)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 10,
          border: `1px solid ${isSam ? 'var(--indigo, #2B3A67)' : 'var(--hairline)'}`,
          background: isDone ? 'rgba(95,132,103,0.08)' : 'var(--paper-raised)',
          cursor: 'pointer',
          textAlign: 'left',
          marginBottom: 8,
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            flexShrink: 0,
            borderRadius: '50%',
            border: `2px solid ${isSam ? 'var(--indigo, #2B3A67)' : 'var(--sage)'}`,
            background: isDone
              ? isSam
                ? 'var(--indigo, #2B3A67)'
                : 'var(--sage)'
              : 'transparent',
            transition: 'all 0.15s ease',
          }}
        />

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--slate)',
            minWidth: 66,
          }}
        >
          {task.start || '09:00'}
        </span>

        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: isDone ? 'line-through' : 'none',
            color: isDone ? 'var(--slate)' : 'var(--ink)',
          }}
        >
          {task.title}
        </span>

        {isEditingThisNote ? (
          <div className="inline-note-editor" onClick={(e) => e.stopPropagation()} style={{ width: '100%', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', background: 'var(--paper)', borderRadius: '8px', border: '1px dashed var(--sage)' }}>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add note or assignment details..."
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--hairline)', background: 'var(--paper)', fontSize: '13px' }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>DEADLINE:</span>
                <input 
                  type="datetime-local" 
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--hairline)', fontSize: '12px', background: 'var(--paper)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditingNoteId(null)} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--slate)', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                <button onClick={() => handleSaveNote(task.id)} style={{ padding: '6px 12px', background: 'var(--indigo)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {noteText && (
              <span className="task-note-inline-badge" onClick={(e) => { e.stopPropagation(); handleOpenNoteEditor(task.id, noteText, deadline); }} title="Click to edit note">
                📝 {noteText}
                {deadline && <span style={{ color: 'var(--cherry)', marginLeft: '6px' }}>🚨 Due: {new Date(deadline).toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
              </span>
            )}

            <button
              className={`note-icon-btn ${noteText ? 'note-icon-btn--active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleOpenNoteEditor(task.id, noteText, deadline); }}
              title={noteText ? 'Edit Note/Deadline' : 'Add Note/Deadline'}
            >
              <FileText size={13} />
            </button>
          </>
        )}
      </div>
    );
  };

  const isRestDay = statusType === 'off' || statusType === 'holiday';

  return (
    <div className="today-view">
      {/* Header Banner */}
      <div className="today-view__header">
        <div>
          <div className="today-date-stamp-row">
            <span className="today-view__date-badge">{dateFormatted} • {timeFormatted}</span>
            {onCycleStatus && (
              <button
                className="today-day-stamp-btn"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg }}
                onClick={() => onCycleStatus(dk, todayName)}
                title="Tap to cycle today's status: Study -> Off -> Holiday"
              >
                <span>Day Mode: {statusStyle.label}</span>
                <RotateCw size={10} />
              </button>
            )}
          </div>
          {(() => {
            const currentHour = now.getHours();
            const currentMins = currentHour * 60 + now.getMinutes();
            const savedName = (typeof window !== 'undefined' ? localStorage.getItem('cadence_user_name') : '') || 'Kartikey';

            const sleepStartStr = sleepSchedule?.sleepStart || '23:30';
            const [bHRaw, bMRaw] = (sleepStartStr || '').split(':').map(Number);
            let bH = bHRaw ?? 23;
            let bM = bMRaw ?? 30;
            if (bH === 12) bH = 0; // 12:30 AM midnight normalization
            const bedMins = bH * 60 + bM;

            // Detect if active past set bedtime or between 00:00 and 05:00 AM
            const isPastBedtime = (currentHour < 5) || (currentMins >= bedMins && bedMins >= 20 * 60);

            let timeGreeting = '';
            if (isPastBedtime) {
              timeGreeting = `Good night, ${savedName}! 🌙 Up late, everything okay?`;
            } else if (currentHour >= 5 && currentHour < 12) {
              timeGreeting = `Good morning, ${savedName}! ☀️`;
            } else if (currentHour >= 12 && currentHour < 17) {
              timeGreeting = `Good afternoon, ${savedName}! 🌤️`;
            } else {
              timeGreeting = `Good evening, ${savedName}! 🌆`;
            }

            return (
              <div>
                <h2 className="today-view__title" style={{ marginBottom: 2 }}>{timeGreeting}</h2>
                <span style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>Today's Focus & Rhythm</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Dintaal Rhythm Cycle Card */}
      {totalTasks > 0 && (
        <div className="dintaal-cycle-card">
          <div className="dintaal-cycle-header">
            <span className="dintaal-mono-label">TODAY'S CYCLE</span>
            <span className="dintaal-done-count">{completedTasks}/{totalTasks} beats ({progressPct}%)</span>
          </div>
          <BeatStrip beats={allToday.map((t) => (taskStatuses[t.id]?.status === 'done'))} size={14} gap={10} />
        </div>
      )}

      {/* Sleep Schedule Banner */}
      <div className="sleep-schedule-card">
        <div className="sleep-schedule-main">
          <BedDouble size={16} className="sleep-icon" />
          <div className="sleep-info">
            <span className="sleep-label">SLEEP SCHEDULE</span>
            {isEditingSleep ? (
              <div className="sleep-edit-group">
                <input
                  type="time"
                  className="sleep-time-input"
                  value={sleepStartInput}
                  onChange={(e) => setSleepStartInput(e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  className="sleep-time-input"
                  value={sleepEndInput}
                  onChange={(e) => setSleepEndInput(e.target.value)}
                />
                <button className="time-save-btn" onClick={handleSaveSleepSchedule}>
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <strong className="sleep-times-display" onClick={() => setIsEditingSleep(true)} title="Click to edit sleep hours">
                {sleepSchedule?.sleepStart || '23:30'} – {sleepSchedule?.sleepEnd || '07:00'} ({sleepHours} hrs rest)
                <Edit2 size={10} className="sleep-edit-icon" />
              </strong>
            )}
          </div>
        </div>
      </div>

      {/* 🌙 LATE NIGHT AWAKE POPUP */}
      {isLateNight && (
        <div className="smart-popup smart-popup--late-night">
          <Moon size={18} className="popup-icon" />
          <div className="popup-body">
            <strong>🌙 You're active late at night!</strong>
            <p>Your target bedtime is {sleepSchedule?.sleepStart || '23:30'}. Getting your {sleepHours} hrs of sleep is crucial for focus tomorrow!</p>
          </div>
          <button className="popup-close-btn" onClick={() => setDismissLateNightPopup(true)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 🎉 FREE TIME PRODUCTIVITY SUGGESTION POPUP */}
      {isFreeTime && (
        <div className="smart-popup smart-popup--free-time">
          <Sparkles size={18} className="popup-icon" />
          <div className="popup-body">
            <strong>🎉 No active task scheduled right now!</strong>
            <p>You have free time right now. Great opportunity for a quick 25m Pomodoro focus session or a short rest!</p>
          </div>
          <button className="popup-close-btn" onClick={() => setDismissFreeTimePopup(true)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Live Next Task Countdown Banner */}
      {!isRestDay && activeTask && (
        <div className="today-view__countdown-banner today-view__countdown-banner--active">
          <Zap size={18} className="spin-slow" />
          <div className="countdown-info">
            <span className="countdown-label">HAPPENING NOW</span>
            <strong>{activeTask.title}</strong>
          </div>
          <span className="countdown-timer">{activeTask.remainingMins}m remaining</span>
        </div>
      )}

      {/* 🚨 ESCALATING DEADLINE NUDGE 🚨 */}
      {deadlineNudge && (
        <div className="deadline-nudge-banner" style={{
          ...deadlineNudge.style,
          borderRadius: 14, padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 16 }}>{deadlineNudge.title}</strong>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 'bold' }}>{deadlineNudge.hoursLeft}h left</span>
          </div>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.9 }}>
            Assignment: <strong>{deadlineNudge.note}</strong>
          </p>
          <div style={{ background: deadlineNudge.level === 'panic' || deadlineNudge.level === 'urgent' ? 'rgba(0,0,0,0.18)' : 'var(--paper)', padding: '8px 12px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Hourglass size={14} />
            <span>You only have <strong>{deadlineNudge.freeHoursLeft} hrs of free slots</strong> remaining today before sleep. {deadlineNudge.level === 'panic' ? 'DO IT NOW!' : 'Plan accordingly!'}</span>
          </div>
        </div>
      )}

      {!isRestDay && !activeTask && nextTask && minutesUntilNext !== null && (
        <div className="today-view__countdown-banner">
          <Hourglass size={18} />
          <div className="countdown-info">
            <span className="countdown-label">NEXT UP AT {nextTask.start}</span>
            <strong>{nextTask.title}</strong>
          </div>
          <span className="countdown-timer">in {minutesUntilNext} mins</span>
        </div>
      )}

      {/* Rest Day / Holiday Banner */}
      {isRestDay && (
        <div className={`today-view__rest-banner today-view__rest-banner--${statusType}`}>
          <CalendarOff size={22} />
          <div className="rest-banner-content">
            <strong>{statusType === 'off' ? 'Scheduled Day Off (Rest Day)' : 'Holiday (Extra Study/Rest)'}</strong>
            <p>Today is stamped as a rest day! Tasks are hidden to keep your focus clear.</p>
          </div>
          <button
            className="cadence-btn rest-toggle-btn"
            onClick={() => setShowTasksOnRestDay(!showTasksOnRestDay)}
          >
            {showTasksOnRestDay ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showTasksOnRestDay ? 'Hide Tasks' : 'View Tasks Anyway'}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {totalTasks === 0 && !isRestDay && (
        <div className="today-view__empty">
          <Coffee size={40} className="today-view__empty-icon" />
          <h3>No tasks scheduled for today</h3>
          <p>Go to the Setup tab to add tasks manually or parse your timetable with AI.</p>
          <button className="cadence-btn cadence-btn--primary" onClick={onNavigateToWeek}>
            Go to Setup & Add Tasks
          </button>
        </div>
      )}

      {/* Render Tasks (Hidden on Rest Days unless user clicks 'View Tasks Anyway') */}
      {(!isRestDay || showTasksOnRestDay) && (
        <>
          {/* Dynamic Sections by Category */}
          {categorySections.map((sec) => (
            <div key={sec.id} className="today-view__section">
              <div className="today-view__section-header">
                <span className="cat-color-dot" style={{ background: sec.color }} />
                <h3>{sec.label}</h3>

                {sec.id === 'college' && (
                  <div className="college-header-actions">
                    {sec.tasks.length > 0 && (
                      <button
                        className="college-mark-all-btn"
                        onClick={handleMarkAllCollegeDone}
                        title="Mark all college classes completed for today"
                      >
                        <CheckCircle2 size={13} />
                        College Completed
                      </button>
                    )}

                    <button
                      className="college-overview-trigger"
                      onClick={() => setIsOverviewOpen(true)}
                      title="View Full College Overview"
                    >
                      <LayoutGrid size={13} />
                      Overview
                    </button>
                  </div>
                )}

                <span className="section-count">{sec.tasks.length} tasks</span>
              </div>
              <div className="today-view__task-list">
                {sec.tasks.length > 0 ? (
                  sec.tasks.map((task, i) => renderTaskCard(task, sec.color, i))
                ) : (
                  <div className="empty-category-pill">
                    <span>No {sec.label} items scheduled for {todayName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Meals & Macro Diet Section */}
          {(todayMeals.length > 0 || categories.some(c => c.id === 'gym' || c.id === 'health')) && (
            <div className="today-view__section">
              <div className="today-view__section-header">
                <Coffee size={16} className="section-icon" />
                <h3>Meals & Macro Diet</h3>
                <span className="section-count">{todayMeals.length} items</span>
              </div>

              {/* Macro Nutrition Summary Grid (Expected vs Taken) */}
              <div className="macro-tracker-card">
                <div className="macro-tracker-header">
                  <strong>🥗 Macro Nutrition Summary (Target vs Actual)</strong>
                  <button
                    className="macro-edit-btn"
                    onClick={() => { setMacroInput(macros); setEditingMacros(!editingMacros); }}
                  >
                    {editingMacros ? 'Cancel' : 'Edit Targets'}
                  </button>
                </div>

                {editingMacros ? (
                  <div className="macro-edit-form">
                    <div className="macro-edit-row">
                      <span>Protein (g):</span>
                      <input
                        type="number"
                        placeholder="Taken"
                        value={macroInput.proteinTaken}
                        onChange={(e) => setMacroInput({ ...macroInput, proteinTaken: Number(e.target.value) })}
                      />
                      <span>/</span>
                      <input
                        type="number"
                        placeholder="Target"
                        value={macroInput.proteinTarget}
                        onChange={(e) => setMacroInput({ ...macroInput, proteinTarget: Number(e.target.value) })}
                      />
                    </div>

                    <div className="macro-edit-row">
                      <span>Carbs (g):</span>
                      <input
                        type="number"
                        placeholder="Taken"
                        value={macroInput.carbsTaken}
                        onChange={(e) => setMacroInput({ ...macroInput, carbsTaken: Number(e.target.value) })}
                      />
                      <span>/</span>
                      <input
                        type="number"
                        placeholder="Target"
                        value={macroInput.carbsTarget}
                        onChange={(e) => setMacroInput({ ...macroInput, carbsTarget: Number(e.target.value) })}
                      />
                    </div>

                    <div className="macro-edit-row">
                      <span>Fats (g):</span>
                      <input
                        type="number"
                        placeholder="Taken"
                        value={macroInput.fatsTaken}
                        onChange={(e) => setMacroInput({ ...macroInput, fatsTaken: Number(e.target.value) })}
                      />
                      <span>/</span>
                      <input
                        type="number"
                        placeholder="Target"
                        value={macroInput.fatsTarget}
                        onChange={(e) => setMacroInput({ ...macroInput, fatsTarget: Number(e.target.value) })}
                      />
                    </div>

                    <button className="cadence-btn cadence-btn--primary macro-save-btn" onClick={handleSaveMacros}>
                      Save Macros
                    </button>
                  </div>
                ) : (
                  <div className="macro-grid">
                    <div className="macro-col macro-col--protein" onClick={() => setEditingMacros(true)} title="Click to edit Protein">
                      <span className="macro-label">PROTEIN</span>
                      <div className="macro-values">
                        <span className="macro-taken">{macros?.proteinTaken || 120}g</span> / <span className="macro-target">{macros?.proteinTarget || 150}g</span>
                      </div>
                      <div className="macro-progress-bar">
                        <div
                          className="macro-progress-fill"
                          style={{
                            width: `${Math.min(100, Math.round(((macros?.proteinTaken || 120) / (macros?.proteinTarget || 150)) * 100))}%`,
                            background: '#3B82F6',
                          }}
                        />
                      </div>
                    </div>

                    <div className="macro-col macro-col--carbs" onClick={() => setEditingMacros(true)} title="Click to edit Carbs">
                      <span className="macro-label">CARBS</span>
                      <div className="macro-values">
                        <span className="macro-taken">{macros?.carbsTaken || 180}g</span> / <span className="macro-target">{macros?.carbsTarget || 220}g</span>
                      </div>
                      <div className="macro-progress-bar">
                        <div
                          className="macro-progress-fill"
                          style={{
                            width: `${Math.min(100, Math.round(((macros?.carbsTaken || 180) / (macros?.carbsTarget || 220)) * 100))}%`,
                            background: '#10B981',
                          }}
                        />
                      </div>
                    </div>

                    <div className="macro-col macro-col--fats" onClick={() => setEditingMacros(true)} title="Click to edit Fats">
                      <span className="macro-label">FATS</span>
                      <div className="macro-values">
                        <span className="macro-taken">{macros?.fatsTaken || 45}g</span> / <span className="macro-target">{macros?.fatsTarget || 60}g</span>
                      </div>
                      <div className="macro-progress-bar">
                        <div
                          className="macro-progress-fill"
                          style={{
                            width: `${Math.min(100, Math.round(((macros?.fatsTaken || 45) / (macros?.fatsTarget || 60)) * 100))}%`,
                            background: '#F59E0B',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 7-Day Weekly Macro & Workout History Tracker */}
                <div className="weekly-macro-history">
                  <span className="history-label">7-Day Weekly History Log (Mon – Sun):</span>
                  <div className="weekly-history-grid">
                    {(WEEKDAYS || []).map((day) => {
                      const dayShort = day ? day.slice(0, 3) : '';
                      const isToday = Array.isArray(weekDates) && weekDates.some((w) => w.dayName === day && w.isToday);
                      return (
                        <div
                          key={day}
                          className={`history-day-card ${isToday ? 'history-day-card--today' : ''}`}
                        >
                          <span className="history-day-name">{dayShort}</span>
                          <span className="history-day-protein">{macros?.proteinTaken || 120}g P</span>
                          <span className="history-day-muscle">
                            {(muscleFocus || []).length > 0 ? (muscleFocus || []).join(', ') : 'Rest'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="today-view__task-list">
                {todayMeals.map((meal) => renderTaskCard(meal, '#C9922B'))}
              </div>
            </div>
          )}
        </>
      )}

      {/* End-of-day Quick Review Banner */}
      {totalTasks > 0 && (!isRestDay || showTasksOnRestDay) && (
        <div className="today-view__review-bar">
          <div className="today-view__review-stats">
            <span className="stat-tag stat-tag--done"><Check size={12} /> {completedTasks} Done</span>
            <span className="stat-tag stat-tag--partial"><Minus size={12} /> {partialTasks} Partial</span>
            <span className="stat-tag stat-tag--skipped"><X size={12} /> {skippedTasks} Skipped</span>
          </div>
          <span className="today-view__review-hint">Tap status buttons to log your progress</span>
        </div>
      )}

      {/* College Overview Modal */}
      <CollegeOverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        collegeSchedule={schedule.college || []}
        taskStatuses={taskStatuses}
      />
    </div>
  );
}
