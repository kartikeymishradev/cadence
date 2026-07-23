import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Volume2, VolumeX, CheckCircle } from 'lucide-react';

export default function PomodoroTimer({ onCompleteSession }) {
  const [mode, setMode] = useState('focus'); // 'focus' | 'shortBreak' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef(null);

  const MODE_TIMES = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    if (soundEnabled) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    }

    if (mode === 'focus') {
      const nextSessions = completedSessions + 1;
      setCompletedSessions(nextSessions);
      if (onCompleteSession) onCompleteSession(25);

      // Auto switch to break
      if (nextSessions % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('focus');
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = ((MODE_TIMES[mode] - timeLeft) / MODE_TIMES[mode]) * 100;

  return (
    <div className="cadence-card pomodoro-card">
      <div className="pomodoro-header">
        <div className="pomodoro-title">
          <Timer size={20} className="pomodoro-icon" />
          <h3>Pomodoro Focus Timer</h3>
        </div>
        <div className="pomodoro-header-actions">
          <button
            className="pomo-sound-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <span className="pomo-session-badge">
            <CheckCircle size={12} /> {completedSessions} Sessions Done
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="pomo-mode-tabs">
        <button
          className={`pomo-tab ${mode === 'focus' ? 'pomo-tab--active' : ''}`}
          onClick={() => switchMode('focus')}
        >
          Focus (25m)
        </button>
        <button
          className={`pomo-tab ${mode === 'shortBreak' ? 'pomo-tab--active' : ''}`}
          onClick={() => switchMode('shortBreak')}
        >
          Short Break (5m)
        </button>
        <button
          className={`pomo-tab ${mode === 'longBreak' ? 'pomo-tab--active' : ''}`}
          onClick={() => switchMode('longBreak')}
        >
          Long Break (15m)
        </button>
      </div>

      {/* Timer Circle / Display */}
      <div className="pomo-display">
        <div className="pomo-clock">{formatTime(timeLeft)}</div>
        <div className="pomo-progress-bar">
          <div className="pomo-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="pomo-controls">
        <button className="cadence-btn pomo-main-btn" onClick={toggleTimer}>
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>
        <button className="cadence-btn pomo-reset-btn" onClick={resetTimer} title="Reset Timer">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
