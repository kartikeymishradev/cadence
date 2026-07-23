import React, { useState } from 'react';
import { Sparkles, BookOpen, GraduationCap, Dumbbell, AlertCircle, Image } from 'lucide-react';
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
            id="tab-btn-skill"
            className={`plan-input__tab ${tab === 'skill' ? 'plan-input__tab--active' : ''}`}
            onClick={() => setTab('skill')}
          >
            <BookOpen size={16} />
            Skill Prep
          </button>

          <button
            id="tab-btn-college"
            className={`plan-input__tab ${tab === 'college' ? 'plan-input__tab--active' : ''}`}
            onClick={() => setTab('college')}
          >
            <GraduationCap size={16} />
            College
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
          tab === 'skill'
            ? "Paste your skill roadmap, e.g. Data Analyst Prep:\nMonday 7pm SQL basics 90m\nTuesday 8pm Python functions 60m..."
            : tab === 'college'
            ? "Paste your college class timetable, e.g.\nMonday 10am DAA Lecture 60m\nMonday 11am IoT Lab 90m..."
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
          {loading ? 'Parsing plan...' : `Parse ${tab === 'skill' ? 'Skill' : tab === 'college' ? 'College' : 'Gym'} Plan`}
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
