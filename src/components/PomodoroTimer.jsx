import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Target, Copy, CheckCircle2 } from 'lucide-react';
import BeatStrip from './BeatStrip';

const NOISE_OPTIONS = [
  { id: 'white', label: 'White Noise', use: 'Loud, chatty coworkers' },
  { id: 'brown', label: 'Brown Noise', use: 'An overactive, racing mind' },
  { id: 'gamma', label: 'Gamma 40Hz', use: 'Deep cognitive focus' },
];

const ALARM_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function PomodoroTimer() {
  const [running, setRunning] = useState(false);
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [copied, setCopied] = useState(false);
  
  const PRESETS = [
    { label: '25/5', focus: 25, brk: 5 },
    { label: '50/10', focus: 50, brk: 10 },
    { label: '90/15', focus: 90, brk: 15 },
  ];
  
  const cycle = ['study', 'break', 'study', 'break', 'study'];
  const [activeBeat, setActiveBeat] = useState(0);
  const [timeLeft, setTimeLeft] = useState(focusMins * 60);
  
  const [noise, setNoise] = useState('brown');
  const [linkedTask, setLinkedTask] = useState('');
  
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio(ALARM_URL));

  const playTick = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.log('Audio tick failed:', e);
    }
  };

  // Initialize time when switching beats or changing config while stopped
  useEffect(() => {
    if (!running) {
      const isBreak = cycle[activeBeat] === 'break';
      setTimeLeft(isBreak ? breakMins * 60 : focusMins * 60);
    }
  }, [focusMins, breakMins, activeBeat, running]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 11 && prev > 1 && cycle[activeBeat] === 'study') {
            playTick();
          }
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            
            // Play alarm
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            
            setActiveBeat((b) => (b + 1) % cycle.length);
            return 0; // The dependency effect above will reset it to next beat's time
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, cycle.length]);

  const handleReset = () => {
    setRunning(false);
    setActiveBeat(0);
    setTimeLeft(focusMins * 60);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const beats = cycle.map((c, i) => (i < activeBeat ? 1 : i === activeBeat ? (c === 'study' ? 1 : 2) : 0));

  return (
    <div style={{ padding: '4px 0 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: 0 }}>
          Focus Cycle
        </h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setFocusMins(p.focus);
                  setBreakMins(p.brk);
                  if (!running) setTimeLeft(p.focus * 60);
                }}
                disabled={running}
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 12,
                  border: '1px solid var(--hairline)',
                  background: focusMins === p.focus ? 'var(--slate)' : 'transparent',
                  color: focusMins === p.focus ? 'var(--paper)' : 'var(--slate)',
                  cursor: running ? 'not-allowed' : 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>F</span>
              <input 
                type="number" 
                value={focusMins} 
                onChange={e => setFocusMins(Number(e.target.value))}
                disabled={running}
                style={{ width: 32, padding: 2, fontSize: 12, border: '1px solid var(--hairline)', borderRadius: 4, background: 'var(--paper)', textAlign: 'center' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>B</span>
              <input 
                type="number" 
                value={breakMins} 
                onChange={e => setBreakMins(Number(e.target.value))}
                disabled={running}
                style={{ width: 32, padding: 2, fontSize: 12, border: '1px solid var(--hairline)', borderRadius: 4, background: 'var(--paper)', textAlign: 'center' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Linked Task */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper-raised)', border: '1px dashed var(--hairline)', padding: '6px 12px', borderRadius: 8, marginBottom: 16 }}>
        <Target size={14} color="var(--slate)" />
        <input 
          type="text" 
          placeholder="What are you focusing on?" 
          value={linkedTask}
          onChange={e => setLinkedTask(e.target.value)}
          style={{ border: 'none', background: 'transparent', fontSize: 13, flex: 1, color: 'var(--ink)', outline: 'none' }}
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(linkedTask);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title="Copy task note"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: copied ? 'var(--sage)' : 'var(--slate)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
        </button>
      </div>

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
            <div style={{ fontSize: 26, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {timeFormatted}
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'capitalize', marginTop: 2 }}>
              {cycle[activeBeat]} block • {activeBeat % 2 === 0 ? focusMins : breakMins}m
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleReset}
              title="Reset Timer"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--hairline)',
                background: 'var(--paper)',
                color: 'var(--slate)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--indigo)',
                color: 'var(--paper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(43,58,103,0.3)',
              }}
            >
              {running ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Ambient Noise Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px', color: 'var(--slate)' }}>
          AMBIENT NOISE
        </span>
        <Volume2 size={12} color="var(--slate)" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: noise === n.id ? 'var(--ink)' : 'var(--slate)' }}>{n.label}</div>
              <div style={{ fontSize: 11, color: 'var(--slate)', opacity: 0.8 }}>{n.use}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
