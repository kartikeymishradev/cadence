import React, { useState } from 'react';
import { HelpCircle, Beaker } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import GuidedTour from './GuidedTour';

export default function Header({ weekStart, activeTheme, onSelectTheme, onStartTour }) {
  return (
    <header className="cadence-header">
      <div className="cadence-header__left">
        <div className="title-row">
          <h1 className="cadence-header__title">Cadence</h1>
          <span className="beta-version-badge">
            <Beaker size={12} />
            v2.4-BETA (Live)
          </span>
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
