import React from 'react';
import { Flag, CheckSquare } from 'lucide-react';

export default function PhaseBanner({ currentPhase }) {
  if (!currentPhase) return null;

  return (
    <div className="phase-banner">
      <div className="phase-banner__header">
        <Flag size={15} className="phase-banner__icon" />
        <span className="phase-banner__name">{currentPhase.name}</span>
        <span className="phase-banner__range">
          (Weeks {currentPhase.startWeek}&ndash;{currentPhase.endWeek})
        </span>
      </div>

      {currentPhase.checkpoint && (
        <div className="phase-banner__checkpoint">
          <CheckSquare size={14} className="phase-banner__check-icon" />
          <span><strong>Phase Goal:</strong> {currentPhase.checkpoint}</span>
        </div>
      )}
    </div>
  );
}
