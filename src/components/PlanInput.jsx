import React, { useState } from 'react';
import { Sparkles, BookOpen, Dumbbell, AlertCircle, Image } from 'lucide-react';
import TimetablePromptModal from './TimetablePromptModal';

export default function PlanInput({
  tab,
  setTab,
  rawText,
  onRawTextChange,
  onParse,
  loading,
  error,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="cadence-card plan-input">
      <div className="plan-input__header">
        <div className="plan-input__tabs">
          <button
            id="tab-btn-study"
            className={`plan-input__tab ${tab === 'study' ? 'plan-input__tab--active' : ''}`}
            onClick={() => setTab('study')}
          >
            <BookOpen size={16} />
            Study
          </button>
          <button
            id="tab-btn-gym"
            className={`plan-input__tab ${tab === 'gym' ? 'plan-input__tab--active' : ''}`}
            onClick={() => setTab('gym')}
          >
            <Dumbbell size={16} />
            Gym and diet
          </button>
        </div>

        <button
          className="timetable-prompt-trigger"
          onClick={() => setIsModalOpen(true)}
          title="Get prompt for timetable image"
        >
          <Image size={14} />
          Have a Timetable Image?
        </button>
      </div>

      <textarea
        id="plan-textarea"
        className="plan-input__textarea"
        rows={4}
        placeholder={
          tab === 'study'
            ? "Paste your study timetable or list tasks, e.g.\nMonday 7pm SQL basics 90m\nTuesday 8pm Python functions 60m..."
            : "Paste your workout & meal plan, e.g.\nMon: Leg day 45m at 7am, Meal 1: Oats & eggs\nTue: Upper body 60m at 7am..."
        }
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
      />

      <div className="plan-input__actions">
        <button
          id="btn-parse-ai"
          className="cadence-btn cadence-btn--primary"
          onClick={onParse}
          disabled={loading || !rawText.trim()}
        >
          <Sparkles size={16} className={loading ? 'spin' : ''} />
          {loading ? 'Parsing plan...' : 'Parse with AI'}
        </button>

        {error && (
          <div className="plan-input__error">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <TimetablePromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
