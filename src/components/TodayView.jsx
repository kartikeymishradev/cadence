import React, { useState, useEffect } from 'react';
import { Clock, CalendarOff, Coffee, Check, Minus, X, Hourglass, Zap, FileText, GraduationCap, LayoutGrid, CheckCircle2, Edit2, Eye, EyeOff } from 'lucide-react';
import { WEEKDAYS } from '../utils/constants';
import { dateKey } from '../utils/dateUtils';
import CollegeOverviewModal from './CollegeOverviewModal';

export default function TodayView({
  weekDates,
  dayStatus,
  categories,
  schedule,
  meals,
  taskStatuses,
  onUpdateTaskStatus,
  onUpdateTaskNote,
  onUpdateTaskTime,
  onNavigateToWeek,
}) {
  // Live Clock State
  const [now, setNow] = useState(new Date());
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [editingTimeId, setEditingTimeId] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [showTasksOnRestDay, setShowTasksOnRestDay] = useState(false);

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
    'study';

  // Group tasks dynamically by custom categories
  const categorySections = categories.map((cat) => {
    const tasks = (schedule[cat.id] || [])
      .filter((t) => t.day === todayName)
      .map((t, i) => ({ ...t, kind: cat.id, indexInCat: i, id: `${cat.id}-${i}` }))
      .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

    return {
      ...cat,
      tasks,
    };
  }).filter((section) => section.tasks.length > 0);

  // Today Meals
  const todayMeals = meals
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
    if (!task.start) continue;
    const [h, m] = task.start.split(':').map(Number);
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

  const handleOpenNoteEditor = (id, existingNote) => {
    setEditingNoteId(id);
    setNoteInput(existingNote || '');
  };

  const handleSaveNote = (id) => {
    onUpdateTaskNote(id, noteInput.trim());
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

  const renderTaskCard = (task, catColor) => {
    const taskState = taskStatuses[task.id] || { status: 'pending', note: '' };
    const curStatus = taskState.status;
    const noteText = taskState.note || '';
    const isEditingThisNote = editingNoteId === task.id;
    const isEditingThisTime = editingTimeId === task.id;

    return (
      <div
        key={task.id}
        className={`today-task-card today-task-card--${curStatus}`}
        style={catColor ? { borderLeftColor: curStatus === 'pending' ? catColor : undefined } : {}}
      >
        <div className="today-task-card__time">
          <Clock size={14} />
          {isEditingThisTime ? (
            <div className="time-edit-inline">
              <input
                type="time"
                className="time-edit-input"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />
              <input
                type="number"
                className="dur-edit-input"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="m"
              />
              <button className="time-save-btn" onClick={() => handleSaveTime(task)}>
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div className="time-display-clickable" onClick={() => handleStartEditTime(task)} title="Click to edit time & duration">
              <span>{task.start || 'Flexible'}</span>
              {task.duration && <span className="today-task-card__dur">({task.duration}m)</span>}
              <Edit2 size={10} className="time-edit-icon" />
            </div>
          )}
        </div>

        <div className="today-task-card__main">
          <div className="today-task-card__title-row">
            <h4 className="today-task-card__title">{task.title}</h4>
            <button
              className={`note-icon-btn ${noteText ? 'note-icon-btn--active' : ''}`}
              onClick={() => handleOpenNoteEditor(task.id, noteText)}
              title={noteText ? 'Edit Note' : 'Add Note / Homework'}
            >
              <FileText size={13} />
            </button>
          </div>

          {/* Attached Note Pill */}
          {noteText && !isEditingThisNote && (
            <div className="task-note-pill" onClick={() => handleOpenNoteEditor(task.id, noteText)}>
              <span>{noteText}</span>
            </div>
          )}

          {/* Inline Note Editor */}
          {isEditingThisNote && (
            <div className="task-note-editor">
              <input
                type="text"
                className="task-note-input"
                placeholder="e.g. Complete assignment in NCS 453..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNote(task.id);
                  if (e.key === 'Escape') setEditingNoteId(null);
                }}
              />
              <button className="cadence-btn task-note-save-btn" onClick={() => handleSaveNote(task.id)}>
                Save
              </button>
            </div>
          )}

          {task.kind === 'meal' && (task.calories || task.protein) && (
            <div className="today-task-card__meta">
              {task.calories && <span>{task.calories} kcal</span>}
              {task.protein && <span>{task.protein}g protein</span>}
            </div>
          )}
        </div>

        <div className="today-task-card__actions">
          <button
            className={`status-btn status-btn--${curStatus}`}
            onClick={() => handleToggleStatus(task.id, curStatus)}
            title="Click to cycle status: Done -> Partial -> Skipped -> Pending"
          >
            {curStatus === 'done' && <Check size={16} />}
            {curStatus === 'partial' && <Minus size={16} />}
            {curStatus === 'skipped' && <X size={16} />}
            {curStatus === 'pending' && <div className="status-btn__circle" />}
            <span className="status-btn__label">{curStatus}</span>
          </button>
        </div>
      </div>
    );
  };

  const isRestDay = statusType === 'off' || statusType === 'holiday';

  return (
    <div className="today-view">
      {/* Header Banner */}
      <div className="today-view__header">
        <div>
          <span className="today-view__date-badge">{dateFormatted} • {timeFormatted}</span>
          <h2 className="today-view__title">Today's Focus</h2>
        </div>

        {totalTasks > 0 && (
          <div className="today-view__progress-pill">
            <span className="today-view__progress-text">{progressPct}% Complete</span>
            <div className="today-view__progress-bar">
              <div className="today-view__progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

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
                    <button
                      className="college-mark-all-btn"
                      onClick={handleMarkAllCollegeDone}
                      title="Mark all college classes completed for today"
                    >
                      <CheckCircle2 size={13} />
                      College Completed
                    </button>

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
                {sec.tasks.map((task) => renderTaskCard(task, sec.color))}
              </div>
            </div>
          ))}

          {/* Meals Section */}
          {todayMeals.length > 0 && (
            <div className="today-view__section">
              <div className="today-view__section-header">
                <Coffee size={16} className="section-icon" />
                <h3>Meals & Diet</h3>
                <span className="section-count">{todayMeals.length} items</span>
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
