import React from 'react';
import { HelpCircle, Beaker } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import BeatStrip from './BeatStrip';

export default function Header({ weekStart, activeTheme, onSelectTheme, onStartTour, streak = 1 }) {
  const streakBeats = Array.from({ length: 5 }, (_, i) => i < Math.min(streak, 5));

  return (
    <header className="cadence-header">
      <div className="cadence-header__left">
        <div className="title-row">
          <h1 className="cadence-header__title">
            Din<span style={{ fontWeight: 400, color: 'var(--indigo, #2B3A67)' }}>taal</span>
          </h1>
          <span className="beta-version-badge">
            <Beaker size={12} />
            v4.5.1 (Live)
          </span>

          <div className="dintaal-streak-chip" title={`${streak} Day Completion Streak!`}>
            <BeatStrip beats={streakBeats} size={7} gap={4} />
            <span className="dintaal-streak-text">{streak}d</span>
          </div>
        </div>
        <p className="cadence-header__subtitle">
          the beat of your day &mdash; paste a plan, get a schedule you can keep.
        </p>
      </div>

      <div className="cadence-header__right">
        <button
          className="header-tutorial-btn"
          onClick={onStartTour}
          title="Start Interactive Guided Tour"
        >
          <HelpCircle size={14} />
          <span>Tour Guide</span>
        </button>

        <ThemeSelector activeTheme={activeTheme} onSelectTheme={onSelectTheme} />

        <span className="cadence-header__week">
          week of{' '}
          {weekStart.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </header>
  );
}
