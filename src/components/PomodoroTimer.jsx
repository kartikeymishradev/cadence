import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Clock, Sparkles, Coffee, Music, Bookmark, Save, Trash2, HelpCircle } from 'lucide-react';

export const NOISE_TYPES = [
  {
    id: 'white',
    name: 'White Noise',
    color: '#3B82F6',
    problem: 'Loud, chatty coworkers',
    solution: 'White Noise',
    why: 'Completely masks human speech.',
  },
  {
    id: 'brown',
    name: 'Brown Noise',
    color: '#8B5CF6',
    problem: 'An overactive, racing mind',
    solution: 'Brown Noise',
    why: 'Deeper tones soothe internal mental chatter.',
  },
  {
    id: 'green',
    name: 'Green Noise',
    color: '#10B981',
    problem: 'Stress or creative blocks',
    solution: 'Green Noise',
    why: 'Organic nature tones foster a relaxed flow state.',
  },
  {
    id: 'pink',
    name: 'Pink Noise',
    color: '#EC4899',
    problem: 'General low-level ambient noise',
    solution: 'Pink Noise',
    why: 'Balanced and comfortable for 8+ hours.',
  },
  {
    id: 'gamma',
    name: 'Gamma 40Hz',
    color: '#F59E0B',
    problem: 'Deep cognitive focus / studying',
    solution: 'Gamma 40Hz Beats',
    why: '40Hz binaural beats boost brainwave concentration.',
  },
];

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
  const [showGuideCard, setShowGuideCard] = useState(true);

  // Active Execution Sequence State
  const [sequence, setSequence] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Ambient Noise Generator State
  const [activeNoise, setActiveNoise] = useState(null); // null | 'white' | 'brown' | 'green' | 'pink' | 'gamma'
  const [volume, setVolume] = useState(0.15);
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

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

  // STOP ALL AUDIO Function
  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        if (noiseNodeRef.current.stop) noiseNodeRef.current.stop();
        if (noiseNodeRef.current.disconnect) noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    setActiveNoise(null);
  };

  // Play / Toggle Multi-Color Noise Synthesizer
  const playNoise = (noiseType) => {
    if (activeNoise === noiseType) {
      stopAudio();
      return;
    }

    stopAudio(); // Stop any running sound first

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        if (noiseType === 'white') {
          data[i] = white;
        } else if (noiseType === 'brown') {
          // Brown noise 1/f^2 algorithm
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        } else if (noiseType === 'pink') {
          // Pink noise 1/f approximation
          data[i] = (white * 0.5);
        } else if (noiseType === 'green') {
          // Green noise (mid-frequency bandpass nature tone)
          data[i] = (white * 0.4);
        }
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNodeRef.current = gainNode;

      if (noiseType === 'gamma') {
        // Binaural Gamma 40Hz (200Hz + 240Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(240, ctx.currentTime);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        noiseNodeRef.current = { stop: () => { osc1.stop(); osc2.stop(); } };
      } else {
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        if (noiseType === 'green') {
          // Apply Bandpass filter (500Hz - 2000Hz)
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1000;
          filter.Q.value = 1.0;
          noiseSource.connect(filter);
          filter.connect(gainNode);
        } else {
          noiseSource.connect(gainNode);
        }

        gainNode.connect(ctx.destination);
        noiseSource.start();
        noiseNodeRef.current = noiseSource;
      }

      setActiveNoise(noiseType);
    } catch (e) {
      console.error('Audio Synthesizer Error:', e);
    }
  };

  // Update volume live
  const handleVolumeChange = (v) => {
    const val = Number(v);
    setVolume(val);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
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
      osc.frequency.setValueAtTime(secs <= 3 ? 880 : 440, ctx.currentTime);
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
    stopAudio(); // STOP AUDIO WHEN SESSION COMPLETES!

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
      setIsRunning(true);
    } else {
      setCompletedSessions((prev) => prev + 1);
      alert('🎉 Session Complete!');
      setCurrentStepIdx(0);
      setTimeLeft((sequence[0]?.durationMins || 25) * 60);
    }
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      // PAUSED -> STOP AUDIO IMMEDIATELY!
      stopAudio();
    }
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    stopAudio(); // STOP AUDIO IMMEDIATELY ON RESET!
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
    stopAudio();
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
          <h3>Focus & Ambient Noise Timer</h3>
        </div>

        <div className="pomodoro-header-actions">
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

      {/* "WHICH AMBIENT SOUND FITS YOUR MIND?" GUIDE CARD */}
      <div className="noise-guide-card">
        <div className="noise-guide-header" onClick={() => setShowGuideCard(!showGuideCard)}>
          <div className="noise-guide-title">
            <HelpCircle size={16} className="guide-icon" />
            <strong>Which Ambient Noise Fits Your Mind?</strong>
          </div>
          <span className="guide-toggle-text">{showGuideCard ? 'Collapse Guide' : 'Expand Guide'}</span>
        </div>

        {showGuideCard && (
          <div className="noise-guide-matrix">
            <table className="noise-matrix-table">
              <thead>
                <tr>
                  <th>If your problem is...</th>
                  <th>Best Choice</th>
                  <th>Why it works</th>
                  <th>Listen</th>
                </tr>
              </thead>
              <tbody>
                {NOISE_TYPES.map((item) => (
                  <tr key={item.id} className={activeNoise === item.id ? 'noise-row--active' : ''}>
                    <td className="problem-cell">{item.problem}</td>
                    <td className="choice-cell">
                      <span className="noise-badge" style={{ borderColor: item.color, color: item.color }}>
                        {item.solution}
                      </span>
                    </td>
                    <td className="why-cell">{item.why}</td>
                    <td className="action-cell">
                      <button
                        className={`noise-play-btn ${activeNoise === item.id ? 'noise-play-btn--active' : ''}`}
                        onClick={() => playNoise(item.id)}
                        style={activeNoise === item.id ? { backgroundColor: item.color, color: '#FFF' } : {}}
                      >
                        {activeNoise === item.id ? <Pause size={12} /> : <Play size={12} />}
                        <span>{activeNoise === item.id ? 'Stop' : 'Play'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Volume Control Bar */}
            {activeNoise && (
              <div className="volume-control-bar">
                <Music size={14} className="vol-icon" />
                <span>Playing {NOISE_TYPES.find(n => n.id === activeNoise)?.name}</span>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="vol-slider"
                />
                <button className="cadence-btn stop-audio-btn" onClick={stopAudio}>
                  Stop Audio
                </button>
              </div>
            )}
          </div>
        )}
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

      {/* CLEAN ICON ONLY CONTROLS (Zero Misaligned Text!) */}
      <div className="pomo-controls">
        <button
          className="cadence-btn cadence-btn--primary pomo-icon-only-btn"
          onClick={handleToggleTimer}
          title={isRunning ? 'Pause Timer' : 'Start Timer'}
        >
          {isRunning ? <Pause size={22} /> : <Play size={22} className="play-icon-offset" />}
        </button>

        <button className="cadence-btn pomo-reset-btn" onClick={handleResetTimer} title="Reset Timer">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
