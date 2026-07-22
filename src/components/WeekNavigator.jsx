import React from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export default function WeekNavigator({
  currentWeekIndex,
  totalWeeks,
  currentWeekTitle,
  onPrevWeek,
  onNextWeek,
}) {
  if (totalWeeks <= 1) return null;

  return (
    <div className="week-nav">
      <div className="week-nav__info">
        <Layers size={15} className="week-nav__icon" />
        <span className="week-nav__label">
          Week {currentWeekIndex + 1} of {totalWeeks}
        </span>
        {currentWeekTitle && (
          <span className="week-nav__title">&mdash; {currentWeekTitle}</span>
        )}
      </div>

      <div className="week-nav__controls">
        <button
          className="cadence-btn week-nav__btn"
          onClick={onPrevWeek}
          disabled={currentWeekIndex === 0}
          title="Previous Week"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="cadence-btn week-nav__btn"
          onClick={onNextWeek}
          disabled={currentWeekIndex >= totalWeeks - 1}
          title="Next Week"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
