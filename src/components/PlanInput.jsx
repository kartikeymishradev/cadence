import React from 'react';
import { Trash2, CheckCircle2, ArrowRight, Calendar, Sparkles, X } from 'lucide-react';

export default function PlanInput({
  tab,
  setTab,
  categories = [],
  schedule = {},
  rawText,
  onRawTextChange,
  onParse,
  onClearCategorySchedule,
  onClearAllSchedules,
  onDeleteTask,
  onNavigateToWeek,
  parseSuccess,
  onDismissParseSuccess,
  loading,
  subjectRegistry = {},
  onUpdateSubjectRegistry,
  semesterConfig = {},
  onUpdateSemesterConfig,
}) {
  const [newSubjName, setNewSubjName] = React.useState('');
  const cats = (Array.isArray(categories) && categories.length > 0) ? categories : [
    { id: 'skill', label: 'Career & Skills', dot: 'var(--sage)' },
    { id: 'college', label: 'College', dot: 'var(--indigo)' },
    { id: 'gym', label: 'Gym & Diet', dot: 'var(--gold)' },
  ];

  const activeCat = tab || cats[0]?.id || 'skill';
  const activeCatObj = cats.find((c) => c.id === activeCat) || cats[0];
  const activeTasks = (schedule && schedule[activeCat]) || [];
  const registeredSubjects = subjectRegistry[activeCat] || [];

  const handleAddSubject = () => {
    if (!newSubjName.trim()) return;
    const newSubj = {
      id: `subj-${Date.now()}`,
      name: newSubjName.trim(),
      color: activeCatObj?.color || 'var(--indigo)',
    };
    const updated = {
      ...subjectRegistry,
      [activeCat]: [...registeredSubjects, newSubj],
    };
    if (onUpdateSubjectRegistry) onUpdateSubjectRegistry(updated);
    setNewSubjName('');
  };

  const handleDeleteSubject = (subjId) => {
    const updated = {
      ...subjectRegistry,
      [activeCat]: registeredSubjects.filter((s) => s.id !== subjId),
    };
    if (onUpdateSubjectRegistry) onUpdateSubjectRegistry(updated);
  };

  return (
    <div style={{ padding: '4px 0 18px' }}>
      <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: '0 0 12px' }}>
        Setup & AI Plan Parser
      </h2>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {cats.map((c) => {
          const active = activeCat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setTab && setTab(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--ink)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color || c.dot || 'var(--sage)' }} />
              {c.label || c.name || 'Category'}
            </button>
          );
        })}
      </div>

      {/* Subject Registry Manager Card */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate)', letterSpacing: '0.5px' }}>
            SUBJECT REGISTRY ({activeCatObj?.label?.toUpperCase()})
          </span>
          <span style={{ fontSize: 11, color: 'var(--slate)' }}>{registeredSubjects.length} subjects registered</span>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {registeredSubjects.map((subj) => (
            <div
              key={subj.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--paper)',
                border: '1px solid var(--hairline)',
                fontSize: 12,
                color: 'var(--ink)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: subj.color || 'var(--sage)' }} />
              <span>{subj.name}</span>
              <button
                onClick={() => handleDeleteSubject(subj.id)}
                title="Remove subject"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 0, marginLeft: 2 }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {registeredSubjects.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--slate)', fontStyle: 'italic' }}>No subjects registered yet. Add one below!</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder={`Add new ${activeCatObj?.label || ''} subject (e.g. Operating Systems)...`}
            value={newSubjName}
            onChange={(e) => setNewSubjName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--hairline)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleAddSubject}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--ink)',
              color: 'var(--paper)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Semester Dates Config Card */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate)', letterSpacing: '0.5px' }}>
            SEMESTER TIMELINE DATES
          </span>
          <span style={{ fontSize: 11, color: 'var(--slate)' }}>Journey Tracker</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>Semester Start Date</label>
            <input
              type="date"
              value={semesterConfig?.semesterStart || '2026-07-15'}
              onChange={(e) => onUpdateSemesterConfig && onUpdateSemesterConfig({ ...semesterConfig, semesterStart: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
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
            <label style={{ display: 'block', fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>Semester End Date</label>
            <input
              type="date"
              value={semesterConfig?.semesterEnd || '2026-12-20'}
              onChange={(e) => onUpdateSemesterConfig && onUpdateSemesterConfig({ ...semesterConfig, semesterEnd: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
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

      {/* Parsing Success Confirmation Banner */}
      {parseSuccess && parseSuccess.catId === activeCat && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1.5px solid var(--sage)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={22} style={{ color: 'var(--sage)', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: 13, color: 'var(--ink)', display: 'block' }}>
                Parsing Done! Added {parseSuccess.count} task{parseSuccess.count === 1 ? '' : 's'} to {parseSuccess.categoryLabel}
              </strong>
              <span style={{ fontSize: 11, color: 'var(--slate)' }}>
                Your updated schedule is live in Week & Today tabs.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onNavigateToWeek && (
              <button
                onClick={onNavigateToWeek}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--sage)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                View Schedule <ArrowRight size={12} />
              </button>
            )}
            {onDismissParseSuccess && (
              <button
                onClick={onDismissParseSuccess}
                title="Dismiss message"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Paste Card */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px', color: 'var(--slate)' }}>
            PASTE YOUR PLAN FOR {activeCatObj?.label?.toUpperCase() || activeCat.toUpperCase()}
          </span>

          {(rawText || activeTasks.length > 0) && (
            <button
              onClick={() => onClearCategorySchedule && onClearCategorySchedule(activeCat)}
              title="Delete text & clear schedule for this category"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                color: 'var(--rose)',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Trash2 size={12} /> Clear {activeCatObj?.label || 'Plan'}
            </button>
          )}
        </div>

        <textarea
          placeholder="Monday 10am DSA Practice 60m&#10;Tuesday 7pm React Revision 90m..."
          value={rawText || ''}
          onChange={(e) => onRawTextChange && onRawTextChange(e.target.value)}
          style={{
            width: '100%',
            marginTop: 8,
            minHeight: 110,
            border: '1px solid var(--hairline)',
            borderRadius: 8,
            padding: 10,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onParse}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--indigo)',
          color: 'var(--paper)',
          fontWeight: 600,
          fontSize: 13,
          fontFamily: 'inherit',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'opacity 0.2s ease',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 20,
        }}
      >
        <Sparkles size={16} />
        {loading ? 'Parsing Plan with AI...' : `Parse ${activeCatObj?.label || ''} Plan with AI`}
      </button>

      {/* Active Parsed Tasks Preview & Management Card */}
      <div
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} style={{ color: activeCatObj?.color || 'var(--indigo)' }} />
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
              Active {activeCatObj?.label} Tasks ({activeTasks.length})
            </strong>
          </div>

          {activeTasks.length > 0 && (
            <button
              onClick={() => onClearCategorySchedule && onClearCategorySchedule(activeCat)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--rose)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Trash2 size={12} /> Delete All
            </button>
          )}
        </div>

        {activeTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeTasks.map((t, idx) => (
              <div
                key={t.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--paper)',
                  border: '1px solid var(--hairline)',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', minWidth: 60 }}>
                    {t.day || 'Mon'} {t.time || t.start || ''}
                  </span>
                  <strong style={{ color: 'var(--ink)' }}>{t.title}</strong>
                  {t.duration && (
                    <span style={{ fontSize: 10, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>
                      ({t.duration}m)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onDeleteTask && onDeleteTask(activeCat, idx)}
                  title="Delete this task"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--slate)',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--slate)', margin: 0, fontStyle: 'italic' }}>
            No active tasks scheduled for this category yet. Paste your text above and click Parse!
          </p>
        )}
      </div>

      {/* Master Clear All Schedules Button */}
      {onClearAllSchedules && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear ALL schedules, tasks, and meals across all categories?')) {
                onClearAllSchedules();
              }
            }}
            style={{
              background: 'transparent',
              border: '1px dashed var(--rose)',
              borderRadius: 10,
              padding: '8px 16px',
              color: 'var(--rose)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Trash2 size={14} /> Wipe All Plans & Reset Schedule
          </button>
        </div>
      )}
    </div>
  );
}
