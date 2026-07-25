import React from 'react';

/**
 * BeatStrip
 * Displays a row of rhythm beats for streak & task completion.
 * The first beat (i === 0) is the "Sam" (downbeat) with an indigo accent ring.
 */
export default function BeatStrip({ beats = [], size = 10, gap = 6 }) {
  return (
    <div className="beat-strip-container" style={{ display: 'flex', alignItems: 'center', gap }}>
      {beats.map((filled, i) => {
        const isSam = i === 0;
        const dim = isSam ? size + 3 : size;
        return (
          <span
            key={i}
            title={isSam ? 'Sam (first beat)' : `Beat ${i + 1}`}
            style={{
              width: dim,
              height: dim,
              borderRadius: '50%',
              background: filled
                ? isSam
                  ? 'var(--indigo, #2B3A67)'
                  : 'var(--sage)'
                : 'transparent',
              border: `2px solid ${
                isSam ? 'var(--indigo, #2B3A67)' : 'var(--slate)'
              }`,
              opacity: filled ? 1 : 0.4,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
}
