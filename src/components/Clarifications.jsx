import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function Clarifications({
  clarifications,
  answers,
  onAnswerChange,
  onRefine,
  loading,
}) {
  if (!clarifications || clarifications.length === 0) return null;

  return (
    <div className="clarifications">
      <div className="clarifications__header">
        <HelpCircle size={15} className="clarifications__icon" />
        <span className="clarifications__title">
          A couple of things I wasn&apos;t sure about
        </span>
      </div>

      {clarifications.map((q) => (
        <div key={q} className="clarifications__item">
          <label className="clarifications__label">{q}</label>
          <input
            type="text"
            className="clarifications__input"
            value={answers[q] || ''}
            onChange={(e) => onAnswerChange(q, e.target.value)}
            placeholder="Your answer"
          />
        </div>
      ))}

      <button
        className="cadence-btn clarifications__submit"
        onClick={onRefine}
        disabled={loading}
      >
        Update schedule
      </button>
    </div>
  );
}
