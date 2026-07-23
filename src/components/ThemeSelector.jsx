import React from 'react';
import { Palette } from 'lucide-react';

export const THEMES = [
  { id: 'paper', label: 'Sage & Paper', color: '#1F3A34', bg: '#EDEFEA' },
  { id: 'dark', label: 'Midnight Dark', color: '#10B981', bg: '#121816' },
  { id: 'nordic', label: 'Nordic Blue', color: '#0284C7', bg: '#F1F5F9' },
  { id: 'matcha', label: 'Matcha', color: '#4D7C0F', bg: '#F4F6F0' },
  { id: 'sunset', label: 'Sunset Rose', color: '#BE185D', bg: '#FDF4F5' },
];

export default function ThemeSelector({ activeTheme, onSelectTheme }) {
  return (
    <div className="theme-selector">
      <div className="theme-selector__title">
        <Palette size={14} />
        <span>Theme:</span>
      </div>

      <div className="theme-selector__pills">
        {THEMES.map((th) => (
          <button
            key={th.id}
            className={`theme-pill ${activeTheme === th.id ? 'theme-pill--active' : ''}`}
            onClick={() => onSelectTheme(th.id)}
            title={th.label}
          >
            <span
              className="theme-pill__swatch"
              style={{ background: th.bg, borderColor: th.color }}
            />
            <span className="theme-pill__label">{th.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
