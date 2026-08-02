import React from 'react';

/**
 * BeatStrip
 * Displays a row of rhythm beats for streak, task completion & day status.
 * Supports study (1: sage/indigo), holiday (2: gold), off (0: transparent).
 */
export default function BeatStrip({ beats = [], size = 10, gap = 6 }) {
  return (
    <div className="beat-strip-container" style={{ display: 'flex', alignItems: 'center', gap }}>
      {beats.map((val, i) => {
        const isSam = i === 0;
        const dim = isSam ? size + 3 : size;
        const isHoliday = val === 2;
        const isFilled = val === 1 || val === true;

        const bg = isHoliday
          ? 'var(--gold)'
          : isFilled
          ? isSam
            ? 'var(--indigo, #2B3A67)'
            : 'var(--sage)'
          : 'transparent';

        const borderColor = isHoliday
          ? 'var(--gold)'
          : isSam
          ? 'var(--indigo, #2B3A67)'
          : 'var(--slate)';

        return (
          <span
            key={i}
            title={isSam ? 'Sam (first beat)' : `Beat ${i + 1}`}
            style={{
              width: dim,
              height: dim,
              borderRadius: '50%',
              background: bg,
              border: `2px solid ${borderColor}`,
              opacity: val ? 1 : 0.4,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
}
