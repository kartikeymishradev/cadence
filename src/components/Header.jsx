import React from 'react';
import ThemeSelector from './ThemeSelector';

export default function Header({ weekStart, activeTheme, onSelectTheme }) {
  return (
    <header className="cadence-header">
      <div className="cadence-header__left">
        <h1 className="cadence-header__title">Cadence</h1>
        <p className="cadence-header__subtitle">
          Paste a plan, get a schedule you can actually keep.
        </p>
      </div>

      <div className="cadence-header__right">
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
