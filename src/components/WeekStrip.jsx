import React from 'react';
import { WEEKDAYS } from '../utils/constants';
import { dateKey } from '../utils/dateUtils';
import BeatStrip from './BeatStrip';

export default function WeekStrip({ weekDates, dayStatus, onCycleStatus }) {
  const statusColor = {
    study: 'var(--sage)',
    off: 'transparent',
    holiday: 'var(--indigo)',
    done: 'var(--sage)',
    partial: 'var(--gold)',
  };

  const safeWeekDates = Array.isArray(weekDates) ? weekDates : [];

  const beats = safeWeekDates.map((d, i) => {
    const dk = dateKey(d);
    const dayName = WEEKDAYS[i];
    const status = dayStatus[dk] || dayStatus[dayName] || 'study';
    return status === 'study' || status === 'done' ? 1 : status === 'holiday' ? 2 : 0;
  });

  const weekTitleDate = safeWeekDates[0]
    ? safeWeekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Jul 20';

  return (
    <div style={{ width: '100%' }}>
      {/* WEEK CYCLE Card */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px', color: 'var(--slate)' }}>
            WEEK CYCLE · {weekTitleDate.toUpperCase()}
          </span>
        </div>
        <BeatStrip beats={beats} size={14} gap={8} />
      </div>

      <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: '0 0 12px' }}>
        Week of {weekTitleDate}
      </h2>
      <p style={{ fontSize: 12, color: 'var(--slate)', margin: '-6px 0 12px' }}>
        Tap a day to cycle: studying &rarr; off &rarr; holiday.
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {safeWeekDates.map((d, i) => {
          const dk = dateKey(d);
          const dayName = WEEKDAYS[i] ? WEEKDAYS[i].slice(0, 3) : 'Day';
          const status = dayStatus[dk] || dayStatus[WEEKDAYS[i]] || 'study';

          return (
            <button
              key={dk}
              onClick={() => onCycleStatus(dk, WEEKDAYS[i])}
              style={{
                flex: '1 1 40px',
                minWidth: 44,
                padding: '10px 4px',
                borderRadius: 10,
                border: `1px solid ${status === 'holiday' ? 'var(--indigo)' : 'var(--hairline)'}`,
                background: 'var(--paper-raised)',
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--slate)' }}>{dayName}</div>
              <div style={{ fontSize: 15, fontWeight: 600, margin: '2px 0 6px' }}>{d.getDate()}</div>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  display: 'inline-block',
                  background: statusColor[status] || 'var(--sage)',
                  border: status === 'off' ? '1px solid var(--hairline)' : 'none',
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
