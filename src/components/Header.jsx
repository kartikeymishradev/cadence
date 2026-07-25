import React from 'react';
import BeatStrip from './BeatStrip';

export default function Header({ streak = 4, dayStatusLabel = 'STUDY MODE' }) {
  const streakBeats = Array.from({ length: 5 }, (_, i) => (i < Math.min(streak, 5) ? 1 : 0));
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <header style={{ padding: '20px 18px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-voice)', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
          Din<span style={{ fontWeight: 400, color: 'var(--indigo)' }}>taal</span>
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--paper-raised)',
            border: '1px solid var(--hairline)',
          }}
        >
          <BeatStrip beats={streakBeats} size={7} gap={4} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--slate)', marginLeft: 2 }}>
            {streak}d
          </span>
        </div>
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate)' }}>the beat of your day</p>
      <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', letterSpacing: '0.3px' }}>
        {todayStr} &nbsp;·&nbsp; {dayStatusLabel.toUpperCase()}
      </p>
    </header>
  );
}
