import React from 'react';

export default function PlanInput({
  tab,
  setTab,
  categories = [],
  rawText,
  onRawTextChange,
  onParse,
  loading,
}) {
  const cats = (Array.isArray(categories) && categories.length > 0) ? categories : [
    { id: 'skill', label: 'Skill Prep', dot: 'var(--sage)' },
    { id: 'college', label: 'College', dot: 'var(--indigo)' },
    { id: 'gym', label: 'Gym & Diet', dot: 'var(--gold)' },
  ];

  const activeCat = tab || cats[0]?.id || 'skill';

  return (
    <div style={{ padding: '4px 0 18px' }}>
      <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: '0 0 12px' }}>
        Setup
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
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px', color: 'var(--slate)' }}>
          PASTE YOUR PLAN
        </span>

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
        }}
      >
        {loading ? 'Parsing Plan...' : 'Parse Plan with AI'}
      </button>
    </div>
  );
}
