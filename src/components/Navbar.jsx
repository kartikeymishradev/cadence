import React from 'react';
import { CalendarDays, CalendarCheck, Timer, Settings } from 'lucide-react';

export default function Navbar({ activeView, onViewChange }) {
  return (
    <nav className="cadence-navbar">
      <div className="cadence-navbar__container">
        <button
          id="nav-tab-today"
          className={`cadence-navbar__tab ${activeView === 'today' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('today')}
        >
          <CalendarCheck size={16} />
          <span>Today</span>
        </button>

        <button
          id="nav-tab-week"
          className={`cadence-navbar__tab ${activeView === 'week' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('week')}
        >
          <CalendarDays size={16} />
          <span>Week</span>
        </button>

        <button
          id="nav-tab-focus"
          className={`cadence-navbar__tab ${activeView === 'focus' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('focus')}
        >
          <Timer size={16} />
          <span>Focus</span>
        </button>

        <button
          id="nav-tab-setup"
          className={`cadence-navbar__tab ${activeView === 'setup' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('setup')}
        >
          <Settings size={16} />
          <span>Setup</span>
        </button>
      </div>
    </nav>
  );
}
