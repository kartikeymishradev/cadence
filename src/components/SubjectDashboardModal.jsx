import React from 'react';
import { X, Clock, Calendar, Zap, BookMarked } from 'lucide-react';

export default function SubjectDashboardModal({
  isOpen,
  onClose,
  subject,
  categoryLabel,
  schedule = {},
  taskStatuses = {},
}) {
  if (!isOpen || !subject) return null;

  // 1. Single-Source Logged Hours (Week & Total)
  let totalMins = 0;
  let lastStudiedDateStr = 'Never';
  let taskCount = 0;

  Object.entries(schedule).forEach(([catId, tasks]) => {
    if (!Array.isArray(tasks)) return;
    tasks.forEach((t) => {
      if (t.subjectId === subject.id || (t.title && t.title.toLowerCase().includes(subject.name.toLowerCase()))) {
        taskCount++;
        const statusInfo = taskStatuses[t.id];
        let mins = 0;
        if (statusInfo?.actualMinutes && Number(statusInfo.actualMinutes) > 0) {
          mins = Number(statusInfo.actualMinutes);
        } else if (statusInfo?.status === 'done') {
          mins = Number(t.duration) || 30;
        } else if (statusInfo?.status === 'partial') {
          mins = Math.round((Number(t.duration) || 30) * 0.5);
        }
        totalMins += mins;

        if (statusInfo?.status === 'done') {
          lastStudiedDateStr = 'This week';
        }
      }
    });
  });

  const totalHours = (totalMins / 60).toFixed(1);

  // 2. Single-Source Deadline Check (reusing Stage A taskStatuses[id].deadline & task notes)
  const upcomingDeadlines = Object.keys(taskStatuses)
    .filter(id => taskStatuses[id]?.deadline && taskStatuses[id]?.status !== 'done')
    .map(id => ({
      id,
      deadline: new Date(taskStatuses[id].deadline),
      note: taskStatuses[id].note
    }))
    .filter(t => !isNaN(t.deadline.getTime()) && t.deadline > new Date())
    .sort((a, b) => a.deadline - b.deadline);

  const closestSubjectDeadline = upcomingDeadlines.find(
    (d) => d.note && d.note.toLowerCase().includes(subject.name.toLowerCase())
  ) || upcomingDeadlines[0];

  let deadlineDisplay = 'No exam date set';
  if (closestSubjectDeadline) {
    const diffMs = closestSubjectDeadline.deadline - new Date();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    deadlineDisplay = `${closestSubjectDeadline.note || 'Exam'} — ${daysLeft === 0 ? 'Today!' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}`;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 16,
          padding: '20px 24px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--slate)', letterSpacing: '0.5px' }}>
              SUBJECT DASHBOARD · {categoryLabel?.toUpperCase() || 'COLLEGE'}
            </span>
            <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 20, margin: '2px 0 0' }}>
              {subject.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>LOGGED FOCUS</span>
            <strong style={{ display: 'block', fontSize: 18, fontFamily: 'var(--font-voice)', color: 'var(--ink)', marginTop: 2 }}>
              {totalHours} hrs
            </strong>
          </div>

          <div style={{ background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>LAST STUDIED</span>
            <strong style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>
              {lastStudiedDateStr}
            </strong>
          </div>
        </div>

        {/* Single-Source Deadline Card */}
        <div style={{ background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <BookMarked size={14} style={{ color: 'var(--indigo)' }} />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>
              NEXT EXAM / MILESTONE (SINGLE-SOURCE)
            </span>
          </div>
          <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{deadlineDisplay}</strong>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: 'none',
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Close Dashboard
        </button>
      </div>
    </div>
  );
}
