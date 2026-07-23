import React from 'react';
import { Info } from 'lucide-react';

export default function InfoFooter({ viewMode }) {
  if (viewMode === 'goals') {
    return (
      <div className="info-footer">
        <Info size={16} className="info-footer__icon" />
        <p className="info-footer__text">
          Use the Daily, Weekly, and Monthly switches to manage your habit & targets. Click Completed (✓), In Progress (-), or Incomplete (✕) to update live percentage completion.
        </p>
      </div>
    );
  }

  if (viewMode === 'focus') {
    return (
      <div className="info-footer">
        <Info size={16} className="info-footer__icon" />
        <p className="info-footer__text">
          Use the Pomodoro Focus Timer during your 25m study blocks. Sound alerts will notify you when it's time for a 5m short break.
        </p>
      </div>
    );
  }

  if (viewMode === 'today') {
    return (
      <div className="info-footer">
        <Info size={16} className="info-footer__icon" />
        <p className="info-footer__text">
          Tap any status button to cycle between Done, Partial, or Skipped. Click any start time stamp to edit time & duration inline.
        </p>
      </div>
    );
  }

  return (
    <div className="info-footer">
      <Info size={16} className="info-footer__icon" />
      <p className="info-footer__text">
        Tap a task&apos;s status to mark it fully done or partial. The progress chart reflects your logged hours across all categories.
      </p>
    </div>
  );
}
