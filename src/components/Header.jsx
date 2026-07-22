import React from 'react';

export default function Header({ weekStart }) {
  return (
    <header className="cadence-header">
      <div className="cadence-header__left">
        <h1 className="cadence-header__title">Cadence</h1>
        <p className="cadence-header__subtitle">
          Paste a plan, get a schedule you can actually keep.
        </p>
      </div>
      <span className="cadence-header__week">
        week of{' '}
        {weekStart.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </header>
  );
}
