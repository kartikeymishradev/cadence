import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Clock, Settings, Sparkles, Coffee } from 'lucide-react';

export default function PomodoroTimer() {
  // Preset vs Custom Mode
  const [mode, setMode] = useState('custom'); // 'preset' | 'custom'

  // Custom Session Inputs
  const [studyMinutes, setStudyMinutes] = useState(60);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [breakCount, setBreakCount] = useState(2);
  const [includeBreaks, setIncludeBreaks] = useState(true);

  // Active Execution Sequence State
  const [sequence, setSequence] = useState([]); // Array of { type: 'study'|'break', durationMins: number, label: string }
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Standard Presets (25m Focus, 5m Short Break, 15m Long Break)
  const [presetType, setPresetType] = useState('focus'); // 'focus' | 'shortBreak' | 'longBreak'

  const timerRef = useRef(null);

  // Calculate sequence when inputs change
  useEffect(() => {
    if (mode === 'custom') {
      const numBreaks = Number(breakCount) || 1;
      const numStudyBlocks = numBreaks + 1;
      const bMins = Number(breakMinutes) || 5;
      const sMinsInput = Number(studyMinutes) || 60;

      let netStudyMins = sMinsInput;
      if (includeBreaks) {
        netStudyMins = Math.max(10, sMinsInput - (numBreaks * bMins));
      }

      const singleStudyMins = Math.max(1, Math.round(netStudyMins / numStudyBlocks));

      const newSeq = [];
      for (let i = 0; i < numStudyBlocks; i++) {
        newSeq.push({
          type: 'study',
          durationMins: singleStudyMins,
          label: `Study Block ${i + 1} of ${numStudyBlocks}`,
        });
        if (i < numBreaks) {
          newSeq.push({
            type: 'break',
            durationMins: bMins,
            label: `Rest Break ${i + 1} of ${numBreaks}`,
          });
        }
      }

      setSequence(newSeq);
      if (!isRunning && currentStepIdx === 0) {
        setTimeLeft(singleStudyMins * 60);
      }
    }
  }, [studyMinutes, breakMinutes, breakCount, includeBreaks, mode]);

  // Preset Selection
  const handleSelectPreset = (type) => {
    setMode('preset');
    setPresetType(type);
    setIsRunning(false);
    if (type === 'focus') setTimeLeft(25 * 60);
    if (type === 'shortBreak') setTimeLeft(5 * 60);
    if (type === 'longBreak') setTimeLeft(15 * 60);
  };

  // Timer Tick Hook
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStepComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, currentStepIdx, sequence, mode, presetType]);

  const handleStepComplete = () => {
    setIsRunning(false);

    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        // audio fallback
      }
    }

    if (mode === 'custom') {
      if (currentStepIdx < sequence.length - 1) {
        const nextIdx = currentStepIdx + 1;
        setCurrentStepIdx(nextIdx);
        setTimeLeft(sequence[nextIdx].durationMins * 60);
        setIsRunning(true); // Auto continue next step!
      } else {
        setCompletedSessions((prev) => prev + 1);
        alert('🎉 Custom Focus & Break Session Completed!');
        setCurrentStepIdx(0);
        setTimeLeft(sequence[0]?.durationMins * 60 || 25 * 60);
      }
    } else {
      if (presetType === 'focus') setCompletedSessions((prev) => prev + 1);
      alert(presetType === 'focus' ? 'Focus time complete! Take a break.' : 'Break complete! Ready to focus?');
    }
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    if (mode === 'custom') {
      setCurrentStepIdx(0);
      setTimeLeft((sequence[0]?.durationMins || 25) * 60);
    } else {
      if (presetType === 'focus') setTimeLeft(25 * 60);
      if (presetType === 'shortBreak') setTimeLeft(5 * 60);
      if (presetType === 'longBreak') setTimeLeft(15 * 60);
    }
  };

  // Format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Dynamic Button Label Logic
  const isCurrentStepBreak = mode === 'custom'
    ? sequence[currentStepIdx]?.type === 'break'
    : presetType !== 'focus';

  const actionButtonText = isRunning
    ? (isCurrentStepBreak ? 'Pause Break' : 'Pause Focus')
    : (isCurrentStepBreak ? 'Start Break' : 'Start Focus');

  // Total session calculation
  const totalSessionMins = mode === 'custom'
    ? (includeBreaks ? Number(studyMinutes) : Number(studyMinutes) + (Number(breakCount) * Number(breakMinutes)))
    : (presetType === 'focus' ? 25 : presetType === 'shortBreak' ? 5 : 15);

  const activeStepObj = mode === 'custom' ? sequence[currentStepIdx] : null;

  return (
    <div className="cadence-card pomodoro-card">
      {/* Header Bar */}
      <div className="pomodoro-header">
        <div className="pomodoro-title">
          <Clock className="pomodoro-icon" size={20} />
          <h3>Automated Focus & Break Timer</h3>
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
            <CheckCircle size={12} />
            {completedSessions} Sessions Done
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="pomo-mode-switcher">
        <button
          className={`pomo-mode-btn ${mode === 'custom' ? 'pomo-mode-btn--active' : ''}`}
          onClick={() => setMode('custom')}
        >
          <Sparkles size={14} />
          Smart Session Builder
        </button>
        <button
          className={`pomo-mode-btn ${mode === 'preset' ? 'pomo-mode-btn--active' : ''}`}
          onClick={() => setMode('preset')}
        >
          <Clock size={14} />
          Standard Presets
        </button>
      </div>

      {/* CUSTOM SESSION BUILDER INPUTS */}
      {mode === 'custom' && (
        <div className="custom-pomo-builder">
          <div className="builder-grid">
            <div className="builder-field">
              <label>Study Time (mins)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={studyMinutes}
                onChange={(e) => setStudyMinutes(e.target.value)}
              />
            </div>

            <div className="builder-field">
              <label>Break Duration (mins)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
              />
            </div>

            <div className="builder-field">
              <label>Number of Breaks</label>
              <input
                type="number"
                min="1"
                max="10"
                value={breakCount}
                onChange={(e) => setBreakCount(e.target.value)}
              />
            </div>
          </div>

          <div className="builder-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeBreaks}
                onChange={(e) => setIncludeBreaks(e.target.checked)}
              />
              <span>Include breaks inside total study time (Total: {totalSessionMins} mins)</span>
            </label>
          </div>

          {/* Sequence Steps Pills */}
          <div className="sequence-pills">
            {sequence.map((step, idx) => (
              <span
                key={idx}
                className={`seq-pill ${idx === currentStepIdx ? 'seq-pill--active' : ''} seq-pill--${step.type}`}
              >
                {step.type === 'study' ? <Clock size={10} /> : <Coffee size={10} />}
                {step.type === 'study' ? `Study (${step.durationMins}m)` : `Break (${step.durationMins}m)`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* STANDARD PRESET TABS */}
      {mode === 'preset' && (
        <div className="pomo-mode-tabs">
          <button
            className={`pomo-tab ${presetType === 'focus' ? 'pomo-tab--active' : ''}`}
            onClick={() => handleSelectPreset('focus')}
          >
            Focus (25m)
          </button>
          <button
            className={`pomo-tab ${presetType === 'shortBreak' ? 'pomo-tab--active' : ''}`}
            onClick={() => handleSelectPreset('shortBreak')}
          >
            Short Break (5m)
          </button>
          <button
            className={`pomo-tab ${presetType === 'longBreak' ? 'pomo-tab--active' : ''}`}
            onClick={() => handleSelectPreset('longBreak')}
          >
            Long Break (15m)
          </button>
        </div>
      )}

      {/* Timer Display */}
      <div className="pomo-display">
        {mode === 'custom' && activeStepObj && (
          <span className="active-step-label">{activeStepObj.label} ({activeStepObj.durationMins} mins)</span>
        )}
        <div className="pomo-clock">{formatTime(timeLeft)}</div>
      </div>

      {/* Controls */}
      <div className="pomo-controls">
        <button className="cadence-btn cadence-btn--primary pomo-main-btn" onClick={handleToggleTimer}>
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          <span>{actionButtonText}</span>
        </button>

        <button className="cadence-btn pomo-reset-btn" onClick={handleResetTimer} title="Reset Timer">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
