import React from 'react';
import { HelpCircle, Beaker, Flame } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Header({ weekStart, activeTheme, onSelectTheme, onStartTour, streak = 1 }) {
  return (
    <header className="cadence-header">
      <div className="cadence-header__left">
        <div className="title-row">
          <h1 className="cadence-header__title">Cadence</h1>
          <span className="beta-version-badge">
            <Beaker size={12} />
            v4.4.2 (Live)
          </span>

          <div className="streak-badge" title={`${streak} Day Completion Streak!`}>
            <Flame size={14} className="streak-icon-fire" />
            <span>{streak} Day Streak</span>
          </div>
        </div>
        <p className="cadence-header__subtitle">
          Paste a plan, get a schedule you can actually keep.
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
