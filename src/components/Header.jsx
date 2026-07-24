import React from 'react';
import { HelpCircle } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import BeatStrip from './BeatStrip';

export default function Header({ weekStart, activeTheme, onSelectTheme, onStartTour, streak = 1 }) {
  const streakBeats = Array.from({ length: 5 }, (_, i) => i < Math.min(streak, 5));

  return (
    <header className="dintaal-header">
      <div className="dintaal-header__top-row">
        <h1 className="dintaal-wordmark">
          Din<span className="dintaal-wordmark__accent">taal</span>
        </h1>

        <div className="dintaal-header__right-group">
          <div className="dintaal-streak-chip" title={`${streak} Day Completion Streak!`}>
            <BeatStrip beats={streakBeats} size={7} gap={4} />
            <span className="dintaal-streak-text">{streak}d</span>
          </div>

          <ThemeSelector activeTheme={activeTheme} onSelectTheme={onSelectTheme} />

          <button
            className="header-tutorial-btn"
            onClick={onStartTour}
            title="Start Interactive Guided Tour"
          >
            <HelpCircle size={14} />
            <span>Tour</span>
          </button>
        </div>
      </div>

      <p className="dintaal-tagline">the beat of your day</p>
    </header>
  );
}
