import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';

export const THEMES = [
  { id: 'paper', label: 'Sage & Paper', color: '#1F3A34', bg: '#EDEFEA' },
  { id: 'dark', label: 'Midnight Dark', color: '#10B981', bg: '#121816' },
  { id: 'nordic', label: 'Nordic Blue', color: '#0284C7', bg: '#F1F5F9' },
  { id: 'matcha', label: 'Matcha', color: '#4D7C0F', bg: '#F4F6F0' },
  { id: 'sunset', label: 'Sunset Rose', color: '#BE185D', bg: '#FDF4F5' },
];

export default function ThemeSelector({ activeTheme, onSelectTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentTheme = THEMES.find((t) => t.id === activeTheme) || THEMES[0];

  return (
    <div className="theme-dropdown-container">
      <button
        className="theme-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <Palette size={15} />
        <span>{currentTheme.label}</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu">
          {THEMES.map((th) => (
            <button
              key={th.id}
              className={`theme-dropdown-item ${activeTheme === th.id ? 'theme-dropdown-item--active' : ''}`}
              onClick={() => {
                onSelectTheme(th.id);
                setIsOpen(false);
              }}
            >
              <span
                className="theme-swatch"
                style={{ background: th.bg, borderColor: th.color }}
              />
              <span>{th.label}</span>
              {activeTheme === th.id && <Check size={14} className="theme-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
