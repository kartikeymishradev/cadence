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
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid var(--hairline)',
        background: 'var(--paper-raised)',
        padding: '6px 4px',
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99,
        marginTop: 'auto',
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            id={`nav-tab-${id}`}
            onClick={() => onViewChange(id)}
            aria-label={label}
            title={label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '8px 2px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active ? 'var(--ink)' : 'var(--slate)',
            }}
          >
            <Icon size={18} />
            <span
              style={{
                width: active ? 5 : 0,
                height: 5,
                borderRadius: '50%',
                background: 'var(--indigo)',
                transition: 'width 0.15s ease',
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
