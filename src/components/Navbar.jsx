import React from 'react';
import { CalendarDays, CalendarCheck, Timer, Settings, BookMarked, Target } from 'lucide-react';

export default function Navbar({ activeView, onViewChange }) {
  return (
    <nav className="cadence-navbar">
      <div className="cadence-navbar__container">
        <button
          id="nav-tab-today"
          className={`cadence-navbar__tab ${activeView === 'today' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('today')}
          aria-label="Today"
          title="Today"
        >
          <CalendarCheck size={16} />
          <span>Today</span>
        </button>

        <button
          id="nav-tab-week"
          className={`cadence-navbar__tab ${activeView === 'week' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('week')}
          aria-label="Week"
          title="Week"
        >
          <CalendarDays size={16} />
          <span>Week</span>
        </button>

        <button
          id="nav-tab-goals"
          className={`cadence-navbar__tab ${activeView === 'goals' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('goals')}
          aria-label="Goals"
          title="Goals"
        >
          <Target size={16} />
          <span>Goals</span>
        </button>

        <button
          id="nav-tab-notes"
          className={`cadence-navbar__tab ${activeView === 'notes' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('notes')}
          aria-label="Notes"
          title="Notes"
        >
          <BookMarked size={16} />
          <span>Notes</span>
        </button>

        <button
          id="nav-tab-focus"
          className={`cadence-navbar__tab ${activeView === 'focus' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('focus')}
          aria-label="Focus"
          title="Focus"
        >
          <Timer size={16} />
          <span>Focus</span>
        </button>

        <button
          id="nav-tab-setup"
          className={`cadence-navbar__tab ${activeView === 'setup' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('setup')}
          aria-label="Setup"
          title="Setup"
        >
          <Settings size={16} />
          <span>Setup</span>
        </button>
      </div>
    </nav>
  );
}
