import React from 'react';
import { Info } from 'lucide-react';

export default function InfoFooter() {
  return (
    <div className="info-footer">
      <Info size={16} className="info-footer__icon" />
      <p className="info-footer__text">
        Tap a task&apos;s circle to mark it fully done, or type the exact
        minutes you actually spent &mdash; 15 of a planned 30, or 60 if you
        went over. The chart reflects logged minutes exactly, so overachieving
        shows up as a taller bar.
      </p>
    </div>
  );
}
