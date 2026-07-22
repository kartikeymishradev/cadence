import React from 'react';

export default function SummaryCards({ totalPlannedMin, completionPct }) {
  return (
    <div className="summary-cards">
      <div className="summary-cards__card">
        <div className="summary-cards__label">Planned this week</div>
        <div className="summary-cards__value">
          {Math.round(totalPlannedMin / 60)}h
        </div>
      </div>
      <div className="summary-cards__card">
        <div className="summary-cards__label">Logged so far</div>
        <div
          className="summary-cards__value"
          style={completionPct > 100 ? { color: 'var(--gold)' } : undefined}
        >
          {completionPct}%
        </div>
      </div>
    </div>
  );
}
