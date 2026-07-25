import React from 'react';
import { Info } from 'lucide-react';

export default function InfoFooter({ viewMode }) {
  const renderFooterContent = () => {
    if (viewMode === 'goals') {
      return (
        <p className="info-footer__text" style={{ margin: 0, fontSize: 12, color: 'var(--slate)' }}>
          Use the habit & target cards to track your weekly completion goals.
        </p>
      );
    }
    if (viewMode === 'focus') {
      return (
        <p className="info-footer__text" style={{ margin: 0, fontSize: 12, color: 'var(--slate)' }}>
          Use the Pomodoro Focus Cycle during your study blocks. Ambient noise presets boost cognitive concentration.
        </p>
      );
    }
    if (viewMode === 'today') {
      return (
        <p className="info-footer__text" style={{ margin: 0, fontSize: 12, color: 'var(--slate)' }}>
          Tap any task beat card to cycle status. The Today's Cycle beat strip updates your daily rhythm in real time.
        </p>
      );
    }
    return (
      <p className="info-footer__text" style={{ margin: 0, fontSize: 12, color: 'var(--slate)' }}>
        Tap a day pill in the Week view to cycle between studying, off, or holiday.
      </p>
    );
  };

  return (
    <div className="info-footer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: 'var(--paper-raised)', borderRadius: 10, border: '1px solid var(--hairline)', marginTop: 16 }}>
      <Info size={16} className="info-footer__icon" style={{ flexShrink: 0, color: 'var(--slate)' }} />
      {renderFooterContent()}
    </div>
  );
}
