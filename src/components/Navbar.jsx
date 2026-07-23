import React from 'react';
import { CalendarDays, CalendarCheck, Target } from 'lucide-react';

export default function Navbar({ activeView, onViewChange }) {
  return (
    <nav className="cadence-navbar">
      <div className="cadence-navbar__container">
        <button
          id="nav-tab-today"
          className={`cadence-navbar__tab ${activeView === 'today' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('today')}
        >
          <CalendarCheck size={18} />
          <span>Today</span>
        </button>

        <button
          id="nav-tab-week"
          className={`cadence-navbar__tab ${activeView === 'week' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('week')}
        >
          <CalendarDays size={18} />
          <span>Week</span>
        </button>

        <button
          id="nav-tab-goals"
          className={`cadence-navbar__tab ${activeView === 'goals' ? 'cadence-navbar__tab--active' : ''}`}
          onClick={() => onViewChange('goals')}
        >
          <Target size={18} />
          <span>Goals</span>
        </button>
      </div>
    </nav>
  );
}
