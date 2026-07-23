import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

export const TOUR_STEPS = [
  {
    targetId: 'theme-dropdown-btn',
    tab: null,
    title: '🎨 Color Themes',
    description: 'Switch between 5 curated themes like Midnight Dark, Nordic Blue, or Sunset Rose anytime from here!',
  },
  {
    targetId: 'nav-tab-today',
    tab: 'today',
    title: '📅 Today View (Daily Focus)',
    description: 'Your main dashboard! Track today\'s tasks, cycle status (Done/Partial/Skipped), click time to edit inline, and add homework notes.',
  },
  {
    targetId: 'nav-tab-week',
    tab: 'week',
    title: '📆 Week View (Mon–Sun Schedule)',
    description: 'View your full weekly timetable. Click day headers to stamp Rest Days / Holidays, or view multi-week progression phases.',
  },
  {
    targetId: 'nav-tab-focus',
    tab: 'focus',
    title: '⏱️ Pomodoro Focus Timer',
    description: 'A clean 25m Focus / 5m Break Pomodoro timer with sound alerts and session counters to boost study focus.',
  },
  {
    targetId: 'nav-tab-setup',
    tab: 'setup',
    title: '⚙️ Setup & Timetables',
    description: 'Add your schedules here! Choose Option A (AI Parse with ChatGPT/Gemini prompt template) or Option B (Manual Form Builder).',
  },
];

export default function GuidedTour({ isOpen, onClose, onViewChange }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = TOUR_STEPS[stepIndex];

  // Auto-switch view tab to match the tour step target
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.tab && onViewChange) {
      onViewChange(step.tab);
    }
  }, [stepIndex, isOpen]);

  // Recalculate target element position for spotlight bounding box
  useEffect(() => {
    if (!isOpen || !step) return;

    const updateRect = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          rawTop: rect.top,
          rawBottom: rect.bottom,
          rawLeft: rect.left,
          rawRight: rect.right,
        });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const timeout = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateRect);
    };
  }, [stepIndex, isOpen, step]);

  if (!isOpen || !step) return null;

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onClose();
      setStepIndex(0);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    setStepIndex(0);
  };

  return (
    <div className="tour-overlay">
      {/* Target Element Highlighting Box */}
      {targetRect && (
        <div
          className="tour-spotlight-box"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        className="tour-tooltip-card"
        style={{
          top: targetRect ? `${Math.min(window.innerHeight - 200, targetRect.rawBottom + 16)}px` : '30%',
          left: targetRect ? `${Math.max(16, Math.min(window.innerWidth - 340, targetRect.rawLeft - 20))}px` : '50%',
        }}
      >
        <div className="tour-tooltip-header">
          <span className="tour-step-badge">Step {stepIndex + 1} of {TOUR_STEPS.length}</span>
          <button className="tour-skip-btn" onClick={handleSkip} title="Skip Tour">
            <X size={15} />
          </button>
        </div>

        <h3 className="tour-tooltip-title">{step.title}</h3>
        <p className="tour-tooltip-desc">{step.description}</p>

        <div className="tour-tooltip-footer">
          <button
            className="tour-nav-arrow-btn"
            onClick={handlePrev}
            disabled={stepIndex === 0}
            title="Previous Step"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="tour-dots">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`tour-dot ${i === stepIndex ? 'tour-dot--active' : ''}`}
                onClick={() => setStepIndex(i)}
              />
            ))}
          </span>

          <button
            className="tour-nav-arrow-btn tour-nav-arrow-btn--next"
            onClick={handleNext}
            title={stepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}
          >
            {stepIndex === TOUR_STEPS.length - 1 ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
