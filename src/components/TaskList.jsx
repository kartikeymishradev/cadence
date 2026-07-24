import React from 'react';
import { WEEKDAYS } from '../utils/constants';
import { dateKey } from '../utils/dateUtils';
import TaskRow from './TaskRow';
import MealRow from './MealRow';

export default function TaskList({
  tasksByDay = [],
  weekDates = [],
  dayStatus = {},
  taskStatuses = {},
  actualMinutes = {},
  mealsLogged = {},
  onQuickToggle,
  onActualChange,
  onMealToggle,
}) {
  const safeTasksByDay = Array.isArray(tasksByDay) ? tasksByDay : [];

  if (safeTasksByDay.length === 0) {
    return (
      <p className="task-list__empty">
        No schedule yet &mdash; paste a plan above and parse it.
      </p>
    );
  }

  return (
    <div className="task-list">
      {safeTasksByDay.map(({ day, items = [], meals = [] }) => {
        const idx = WEEKDAYS.indexOf(day);
        const dk = (Array.isArray(weekDates) && weekDates[idx]) ? dateKey(weekDates[idx]) : null;
        const status = dk ? (dayStatus[dk] || 'study') : 'study';

        return (
          <div key={day} className="task-list__day">
            <div className="task-list__day-header">{day.toUpperCase()}</div>

            {(Array.isArray(items) ? items : []).map((t) => (
              <TaskRow
                key={t.id || Math.random()}
                task={t}
                taskStatus={taskStatuses[t?.id]}
                actual={actualMinutes[t?.id]}
                status={status}
                onQuickToggle={onQuickToggle}
                onActualChange={onActualChange}
              />
            ))}

            {(Array.isArray(meals) ? meals : []).map((m) => (
              <MealRow
                key={m.id || Math.random()}
                meal={m}
                logged={!!mealsLogged[m?.id]}
                onToggle={onMealToggle}
              />
            ))}

            {status === 'holiday' && (
              <div className="task-list__holiday-hint">
                Holiday &mdash; consider adding an extra session today.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
