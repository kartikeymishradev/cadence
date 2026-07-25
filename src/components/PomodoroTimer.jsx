import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import BeatStrip from './BeatStrip';

const NOISE_OPTIONS = [
  { id: 'white', label: 'White Noise', use: 'Loud, chatty coworkers' },
  { id: 'brown', label: 'Brown Noise', use: 'An overactive, racing mind' },
  { id: 'gamma', label: 'Gamma 40Hz', use: 'Deep cognitive focus' },
];

export default function PomodoroTimer() {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [activeBeat, setActiveBeat] = useState(0);
  const [noise, setNoise] = useState('brown');
  const timerRef = useRef(null);

  const cycle = ['study', 'break', 'study', 'break', 'study'];

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            setActiveBeat((b) => (b + 1) % cycle.length);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const beats = cycle.map((c, i) => (i < activeBeat ? 1 : i === activeBeat ? (c === 'study' ? 1 : 2) : 0));

  return (
    <div style={{ padding: '4px 0 18px' }}>
      <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: '0 0 12px' }}>
        Focus Cycle
      </h2>

      {/* Focus Cycle Card */}
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
            SESSION AVARTAN
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {activeBeat + 1} / {cycle.length}
          </span>
        </div>

        <BeatStrip beats={beats} size={16} gap={10} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {timeFormatted}
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'capitalize' }}>
              {cycle[activeBeat]} block
            </div>
          </div>

          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--indigo)',
              color: 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>

        <button
          onClick={() => {
            setActiveBeat((b) => (b + 1) % cycle.length);
            setTimeLeft(25 * 60);
          }}
          style={{
            marginTop: 10,
            fontSize: 11,
            color: 'var(--slate)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          (advance beat)
        </button>
      </div>

      {/* Ambient Noise Section */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px', color: 'var(--slate)' }}>
        AMBIENT NOISE
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {NOISE_OPTIONS.map((n) => (
          <button
            key={n.id}
            onClick={() => setNoise(n.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${noise === n.id ? 'var(--indigo)' : 'var(--hairline)'}`,
              background: 'var(--paper-raised)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n.label}</div>
              <div style={{ fontSize: 11, color: 'var(--slate)' }}>{n.use}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
