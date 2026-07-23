import React from 'react';
import { CheckCircle2, Clock, CalendarOff, AlertCircle, Check, Minus, X, Coffee, BookOpen, Dumbbell } from 'lucide-react';
import { WEEKDAYS } from '../utils/constants';

export default function TodayView({
  weekDates,
  dayStatus,
  schedule,
  meals,
  taskStatuses,
  onUpdateTaskStatus,
  onNavigateToWeek,
}) {
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // Convert Sun=0 to Mon=0..Sun=6
  const todayName = WEEKDAYS[dayIndex];
  const dateObj = weekDates[dayIndex] || today;

  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const dayStatusKey = `study-${todayName}`;
  const statusType = dayStatus[dayStatusKey] || 'study';

  // Gather tasks across all categories for today
  const todayTasks = [
    ...schedule.study
      .filter((t) => t.day === todayName)
      .map((t, i) => ({ ...t, kind: 'study', id: `study-${i}` })),

    ...schedule.gym
      .filter((t) => t.day === todayName)
      .map((t, i) => ({ ...t, kind: 'gym', id: `gym-${i}` })),

    ...meals
      .filter((m) => m.day === todayName)
      .map((m, i) => ({
        id: `meal-${i}`,
        kind: 'meal',
        title: m.name,
        start: m.time || '12:00',
        duration: 20,
        calories: m.calories,
        protein: m.protein,
      })),
  ].sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

  // Calculate metrics
  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter(
    (t) => taskStatuses[t.id]?.status === 'done'
  ).length;
  const partialTasks = todayTasks.filter(
    (t) => taskStatuses[t.id]?.status === 'partial'
  ).length;
  const skippedTasks = todayTasks.filter(
    (t) => taskStatuses[t.id]?.status === 'skipped'
  ).length;

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

  return (
    <div className="today-view">
      {/* Header Banner */}
      <div className="today-view__header">
        <div>
          <span className="today-view__date-badge">{dateFormatted}</span>
          <h2 className="today-view__title">Today's Schedule</h2>
        </div>

        {totalTasks > 0 && (
          <div className="today-view__progress-pill">
            <span className="today-view__progress-text">{progressPct}% Complete</span>
            <div className="today-view__progress-bar">
              <div
                className="today-view__progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Rest Day / Holiday Banner */}
      {statusType !== 'study' && (
        <div className={`today-view__rest-banner today-view__rest-banner--${statusType}`}>
          <CalendarOff size={20} />
          <div>
            <strong>{statusType === 'off' ? 'Scheduled Day Off' : 'Holiday / Extra Rest'}</strong>
            <p>Take time to recharge! Any planned tasks for today are optional.</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalTasks === 0 && (
        <div className="today-view__empty">
          <Coffee size={40} className="today-view__empty-icon" />
          <h3>No tasks scheduled for today</h3>
          <p>You haven't pasted a schedule yet or today is completely clear.</p>
          <button className="cadence-btn cadence-btn--primary" onClick={onNavigateToWeek}>
            Go to Week View & Parse Plan
          </button>
        </div>
      )}

      {/* Unified Task List */}
      {totalTasks > 0 && (
        <div className="today-view__task-list">
          {todayTasks.map((task) => {
            const taskState = taskStatuses[task.id] || { status: 'pending' };
            const curStatus = taskState.status;

            return (
              <div
                key={task.id}
                className={`today-task-card today-task-card--${curStatus} today-task-card--${task.kind}`}
              >
                <div className="today-task-card__time">
                  <Clock size={14} />
                  <span>{task.start || 'Flexible'}</span>
                  {task.duration && <span className="today-task-card__dur">({task.duration}m)</span>}
                </div>

                <div className="today-task-card__main">
                  <div className="today-task-card__title-row">
                    <span className="today-task-card__badge">
                      {task.kind === 'study' && <BookOpen size={12} />}
                      {task.kind === 'gym' && <Dumbbell size={12} />}
                      {task.kind === 'meal' && <Coffee size={12} />}
                      {task.kind.toUpperCase()}
                    </span>
                    <h4 className="today-task-card__title">{task.title}</h4>
                  </div>

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
          })}
        </div>
      )}

      {/* End-of-day Quick Review Banner */}
      {totalTasks > 0 && (
        <div className="today-view__review-bar">
          <div className="today-view__review-stats">
            <span className="stat-tag stat-tag--done"><Check size={12} /> {completedTasks} Done</span>
            <span className="stat-tag stat-tag--partial"><Minus size={12} /> {partialTasks} Partial</span>
            <span className="stat-tag stat-tag--skipped"><X size={12} /> {skippedTasks} Skipped</span>
          </div>
          <span className="today-view__review-hint">Tap any task status button to update your progress</span>
        </div>
      )}
    </div>
  );
}
