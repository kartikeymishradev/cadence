import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Clock, Sparkles, Coffee, Music, Bookmark, Save, Trash2 } from 'lucide-react';

export default function PomodoroTimer() {
  // Custom Session Inputs
  const [studyMinutes, setStudyMinutes] = useState(60);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [breakCount, setBreakCount] = useState(2);
  const [includeBreaks, setIncludeBreaks] = useState(true);

  // Saved Presets List
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('cadence_pomo_presets');
      return saved ? JSON.parse(saved) : [
        { name: '1 Hr Focus (2 Breaks)', studyMinutes: 60, breakMinutes: 5, breakCount: 2, includeBreaks: true },
        { name: '2 Hr Deep Work (3 Breaks)', studyMinutes: 120, breakMinutes: 10, breakCount: 3, includeBreaks: true }
      ];
    } catch {
      return [];
    }
  });

  const [presetNameInput, setPresetNameInput] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Active Execution Sequence State
  const [sequence, setSequence] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Gamma 40Hz Focus Audio Synthesizer State
  const [isPlayingGamma, setIsPlayingGamma] = useState(false);
  const audioCtxRef = useRef(null);
  const gammaOscRef = useRef(null);

  const timerRef = useRef(null);

  // Calculate sequence when inputs change
  useEffect(() => {
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
  }, [studyMinutes, breakMinutes, breakCount, includeBreaks]);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('cadence_pomo_presets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  // Gamma 40Hz Audio Binaural Generator
  const toggleGammaMusic = () => {
    if (isPlayingGamma) {
      if (gammaOscRef.current) {
        try { gammaOscRef.current.stop(); } catch (e) {}
      }
      setIsPlayingGamma(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Carrier 200Hz + 240Hz = 40Hz Gamma Pulsing Binaural Tone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(240, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime); // Soft volume

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        gammaOscRef.current = { stop: () => { osc1.stop(); osc2.stop(); ctx.close(); } };

        setIsPlayingGamma(true);
      } catch (e) {
        console.error('Audio Synthesizer Error:', e);
      }
    }
  };

  // Play Ticking Sound for 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 seconds
  const playTickSound = (secs) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(secs <= 3 ? 880 : 440, ctx.currentTime); // Higher pitch for last 3 secs
      gain.gain.setValueAtTime(0.05, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  // Timer Tick Hook
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1 && prev <= 10) {
            playTickSound(prev - 1);
          }

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
  }, [isRunning, currentStepIdx, sequence, soundEnabled]);

  const handleStepComplete = () => {
    setIsRunning(false);

    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {}
    }

    if (currentStepIdx < sequence.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      setTimeLeft(sequence[nextIdx].durationMins * 60);
      setIsRunning(true); // Auto continue next step!
    } else {
      setCompletedSessions((prev) => prev + 1);
      alert('🎉 Session Complete!');
      setCurrentStepIdx(0);
      setTimeLeft((sequence[0]?.durationMins || 25) * 60);
    }
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setCurrentStepIdx(0);
    setTimeLeft((sequence[0]?.durationMins || 25) * 60);
  };

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    const newPreset = {
      name: presetNameInput.trim(),
      studyMinutes: Number(studyMinutes),
      breakMinutes: Number(breakMinutes),
      breakCount: Number(breakCount),
      includeBreaks,
    };
    setSavedPresets([...savedPresets, newPreset]);
    setPresetNameInput('');
    setShowSaveInput(false);
  };

  const handleLoadPreset = (p) => {
    setIsRunning(false);
    setStudyMinutes(p.studyMinutes);
    setBreakMinutes(p.breakMinutes);
    setBreakCount(p.breakCount);
    setIncludeBreaks(p.includeBreaks);
    setCurrentStepIdx(0);
  };

  const handleDeletePreset = (idx) => {
    setSavedPresets(savedPresets.filter((_, i) => i !== idx));
  };

  // Format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalSessionMins = includeBreaks
    ? Number(studyMinutes)
    : Number(studyMinutes) + (Number(breakCount) * Number(breakMinutes));

  const activeStepObj = sequence[currentStepIdx];

  return (
    <div className="cadence-card pomodoro-card">
      {/* Header Bar */}
      <div className="pomodoro-header">
        <div className="pomodoro-title">
          <Clock className="pomodoro-icon" size={20} />
          <h3>Custom Session Timer</h3>
        </div>

        <div className="pomodoro-header-actions">
          {/* Gamma 40Hz Audio Toggle */}
          <button
            className={`pomo-gamma-btn ${isPlayingGamma ? 'pomo-gamma-btn--active' : ''}`}
            onClick={toggleGammaMusic}
            title="Play/Pause 40Hz Gamma Focus Audio"
          >
            <Music size={14} />
            <span>{isPlayingGamma ? 'Pause Gamma Beats' : 'Play 40Hz Gamma Beats'}</span>
          </button>

          <button
            className="pomo-sound-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Tick & Alarm Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <span className="pomo-session-badge">
            <CheckCircle size={12} />
            {completedSessions} Sessions Done
          </span>
        </div>
      </div>

      {/* CUSTOM SESSION BUILDER INPUTS */}
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

          <button
            className="cadence-btn save-preset-trigger-btn"
            onClick={() => setShowSaveInput(!showSaveInput)}
          >
            <Bookmark size={13} />
            <span>Save Preset</span>
          </button>
        </div>

        {/* Save Preset Input Bar */}
        {showSaveInput && (
          <div className="save-preset-bar">
            <input
              type="text"
              className="save-preset-input"
              placeholder="Preset Name (e.g. 90m Intensive)..."
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
            />
            <button className="cadence-btn cadence-btn--primary" onClick={handleSavePreset}>
              <Save size={13} /> Save
            </button>
          </div>
        )}

        {/* Saved Presets Chips */}
        {savedPresets.length > 0 && (
          <div className="saved-presets-container">
            <span className="saved-presets-label">Saved Presets:</span>
            {savedPresets.map((p, idx) => (
              <span key={idx} className="saved-preset-chip" onClick={() => handleLoadPreset(p)}>
                <span>{p.name} ({p.studyMinutes}m)</span>
                <button
                  className="delete-preset-icon"
                  onClick={(e) => { e.stopPropagation(); handleDeletePreset(idx); }}
                  title="Delete Preset"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

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

      {/* Timer Display */}
      <div className="pomo-display">
        {activeStepObj && (
          <span className="active-step-label">{activeStepObj.label} ({activeStepObj.durationMins} mins)</span>
        )}
        <div className="pomo-clock">{formatTime(timeLeft)}</div>
      </div>

      {/* Clean Icon Controls (No redundant "Start Focus / Break" text) */}
      <div className="pomo-controls">
        <button className="cadence-btn cadence-btn--primary pomo-main-btn" onClick={handleToggleTimer}>
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button className="cadence-btn pomo-reset-btn" onClick={handleResetTimer} title="Reset Timer">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
