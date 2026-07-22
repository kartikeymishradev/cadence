import React from 'react';
import { BookOpen, Dumbbell, Sparkles, Loader2 } from 'lucide-react';

const TABS = [
  { key: 'study', label: 'Study', icon: BookOpen },
  { key: 'gym', label: 'Gym and diet', icon: Dumbbell },
];

const PLACEHOLDERS = {
  study:
    'Paste your study plan, any format \u2014 e.g. "Mon and Wed evenings: 2hrs calculus, Tue: chemistry lab review 1hr\u2026"',
  gym:
    'Paste your gym and diet plan \u2014 e.g. "Push day Mon/Thu 6am 1hr, breakfast 8am 400 cal 30g protein, leg day Wed\u2026"',
};

export default function PlanInput({
  tab,
  setTab,
  rawText,
  onRawTextChange,
  onParse,
  loading,
  error,
}) {
  return (
    <div className="plan-input">
      <div className="plan-input__tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`cadence-btn plan-input__tab ${
              tab === key ? 'plan-input__tab--active' : ''
            }`}
            onClick={() => setTab(key)}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <textarea
        className="plan-input__textarea"
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
        placeholder={PLACEHOLDERS[tab]}
        rows={4}
      />

      <div className="plan-input__actions">
        <button
          className="cadence-btn plan-input__parse"
          onClick={onParse}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={15} className="spin" />
          ) : (
            <Sparkles size={15} />
          )}
          {loading ? 'Working\u2026' : 'Parse with AI'}
        </button>
        {error && <span className="plan-input__error">{error}</span>}
      </div>
    </div>
  );
}
