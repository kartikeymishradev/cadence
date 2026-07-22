import React from 'react';
import { WEEKDAYS, STATUS_STYLE } from '../utils/constants';
import { dateKey } from '../utils/dateUtils';

export default function WeekStrip({ weekDates, dayStatus, onCycleStatus }) {
  return (
    <div className="week-strip">
      <div className="week-strip__days">
        {weekDates.map((d, i) => {
          const dk = dateKey(d);
          const status = dayStatus[dk] || 'study';
          const style = STATUS_STYLE[status];

          return (
            <button
              key={dk}
              className="cadence-btn week-strip__day"
              onClick={() => onCycleStatus(dk)}
            >
              <div className="week-strip__weekday">
                {WEEKDAYS[i].slice(0, 3)}
              </div>
              <div className="week-strip__date">{d.getDate()}</div>
              <span
                key={status}
                className="cadence-stamp week-strip__stamp"
                style={{ backgroundColor: style.bg, color: style.fg }}
              >
                {style.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="week-strip__hint">
        Tap a day to cycle it: studying, a day off, or a holiday (extra room to
        study).
      </p>
    </div>
  );
}
