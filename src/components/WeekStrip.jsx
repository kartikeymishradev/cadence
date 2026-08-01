import React from 'react';
import { WEEKDAYS } from '../utils/constants';
import { dateKey } from '../utils/dateUtils';
import BeatStrip from './BeatStrip';

export default function WeekStrip({
  weekDates,
  dayStatus,
  onCycleStatus,
  schedule = {},
  taskStatuses = {},
  subjectRegistry = {},
  categories = [],
  weeklyReflection = {},
  onUpdateWeeklyReflection,
}) {
  const reflectionData = weeklyReflection || {};

  const handleChangeReflection = (field, val) => {
    if (onUpdateWeeklyReflection) {
      onUpdateWeeklyReflection({
        ...reflectionData,
        [field]: val,
      });
    }
  };
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

  // ── Feature 4: Subject Heatmap Calculation ──
  const subjectHoursMap = {};
  let totalWeekMins = 0;

  Object.entries(schedule).forEach(([catId, tasks]) => {
    if (!Array.isArray(tasks)) return;
    tasks.forEach((t) => {
      const statusInfo = taskStatuses[t.id];
      let mins = 0;
      if (statusInfo?.actualMinutes && Number(statusInfo.actualMinutes) > 0) {
        mins = Number(statusInfo.actualMinutes);
      } else if (statusInfo?.status === 'done') {
        mins = Number(t.duration) || 30;
      } else if (statusInfo?.status === 'partial') {
        mins = Math.round((Number(t.duration) || 30) * 0.5);
      }

      if (mins > 0) {
        const subjId = t.subjectId || 'unassigned';
        subjectHoursMap[subjId] = (subjectHoursMap[subjId] || 0) + mins;
        totalWeekMins += mins;
      }
    });
  });

  // Build list of all subjects with hours logged or registered
  const allRegisteredList = [];
  Object.entries(subjectRegistry).forEach(([catId, subjs]) => {
    (subjs || []).forEach((s) => {
      const mins = subjectHoursMap[s.id] || 0;
      allRegisteredList.push({
        id: s.id,
        name: s.name,
        color: s.color || 'var(--indigo)',
        hours: mins / 60,
      });
    });
  });

  if (subjectHoursMap['unassigned'] && subjectHoursMap['unassigned'] > 0) {
    allRegisteredList.push({
      id: 'unassigned',
      name: 'Unassigned Tasks',
      color: 'var(--slate)',
      hours: subjectHoursMap['unassigned'] / 60,
    });
  }

  // Filter & sort subjects by hours logged
  const activeSubjectHeatmap = allRegisteredList
    .filter((s) => s.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  const maxHours = Math.max(...activeSubjectHeatmap.map((s) => s.hours), 1);
  const totalWeekHours = totalWeekMins / 60;

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

      {/* Feature 4: STAGE B SUBJECT HEATMAP CARD */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.5px', color: 'var(--slate)' }}>
            SUBJECT HEATMAP (WEEK VIEW)
          </span>
          <span style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {totalWeekHours.toFixed(1)} hrs total
          </span>
        </div>

        {activeSubjectHeatmap.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeSubjectHeatmap.map((item) => {
              const pct = Math.round((item.hours / maxHours) * 100);
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                      <strong>{item.name}</strong>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                      {item.hours.toFixed(1)} hrs
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--paper)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--slate)', fontStyle: 'italic' }}>
            No subject hours logged yet this week. Mark tasks as done in Today view to log hours!
          </span>
        )}
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
              <div style={{ fontSize: 10, color: status === 'holiday' ? 'var(--indigo)' : status === 'off' ? 'var(--slate)' : 'var(--sage)', fontWeight: 'bold' }}>
                {status === 'holiday' ? 'HOL' : status === 'off' ? 'OFF' : '•'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature 7: STAGE C WEEKLY REFLECTION CARD */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 16px',
          marginTop: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.5px', color: 'var(--slate)' }}>
            WEEKLY REFLECTION JOURNAL
          </span>
          <span style={{ fontSize: 11, color: 'var(--slate)' }}>3 Fixed Questions</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              1. What went well this week?
            </label>
            <input
              type="text"
              placeholder="e.g. Completed all DAA assignments and stayed consistent with sleep..."
              value={reflectionData.wentWell || ''}
              onChange={(e) => handleChangeReflection('wentWell', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: 12,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              2. What was your biggest distraction?
            </label>
            <input
              type="text"
              placeholder="e.g. Late night scrolling on Tuesday..."
              value={reflectionData.biggestDistraction || ''}
              onChange={(e) => handleChangeReflection('biggestDistraction', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: 12,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              3. What is your primary focus for next week?
            </label>
            <input
              type="text"
              placeholder="e.g. Finish Big Data project & study IoT Unit 2..."
              value={reflectionData.nextWeekFocus || ''}
              onChange={(e) => handleChangeReflection('nextWeekFocus', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: 12,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
