import React from 'react';
import { CalendarDays, CalendarCheck, Timer, Settings, BookMarked, Target } from 'lucide-react';

export default function Navbar({ activeView, onViewChange }) {
  const NAV_ITEMS = [
    { id: 'today', label: 'Today', icon: CalendarCheck },
    { id: 'week', label: 'Week', icon: CalendarDays },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'notes', label: 'Notes', icon: BookMarked },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'setup', label: 'Setup', icon: Settings },
  ];

  return (
    <nav className="dintaal-bottom-nav">
      <div className="dintaal-bottom-nav__container">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              id={`nav-tab-${id}`}
              onClick={() => onViewChange(id)}
              aria-label={label}
              title={label}
              className={`dintaal-bottom-nav__btn ${active ? 'dintaal-bottom-nav__btn--active' : ''}`}
            >
              <Icon size={18} />
              <span className={`dintaal-nav-dot ${active ? 'dintaal-nav-dot--active' : ''}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
