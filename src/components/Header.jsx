import React, { useState } from 'react';
import { HelpCircle, BookOpen } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import TutorialModal from './TutorialModal';

export default function Header({ weekStart, activeTheme, onSelectTheme }) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return (
    <header className="cadence-header">
      <div className="cadence-header__left">
        <h1 className="cadence-header__title">Cadence</h1>
        <p className="cadence-header__subtitle">
          Paste a plan, get a schedule you can actually keep.
        </p>
      </div>

      <div className="cadence-header__right">
        <button
          className="header-tutorial-btn"
          onClick={() => setIsTutorialOpen(true)}
          title="View App Tutorial & Guide"
        >
          <HelpCircle size={14} />
          <span>Tutorial</span>
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

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </header>
  );
}
