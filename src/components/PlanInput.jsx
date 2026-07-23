import React, { useState } from 'react';
import { Sparkles, AlertCircle, Image, Settings, Plus } from 'lucide-react';
import TimetablePromptModal from './TimetablePromptModal';
import CategorySettingsModal from './CategorySettingsModal';

export default function PlanInput({
  tab,
  setTab,
  categories,
  onSaveCategories,
  rawText,
  onRawTextChange,
  onParse,
  loading,
  error,
}) {
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const activeCategory = categories.find((c) => c.id === tab) || categories[0] || { label: 'Plan' };

  return (
    <section className="cadence-card plan-input">
      <div className="plan-input__header">
        <div className="plan-input__tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`tab-btn-${cat.id}`}
              className={`plan-input__tab ${tab === cat.id ? 'plan-input__tab--active' : ''}`}
              onClick={() => setTab(cat.id)}
            >
              <span className="tab-color-indicator" style={{ background: cat.color }} />
              {cat.label}
            </button>
          ))}

          <button
            className="plan-input__tab-manage"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Manage Categories"
          >
            <Settings size={14} />
          </button>
        </div>

        <button
          className="timetable-prompt-trigger"
          onClick={() => setIsPromptModalOpen(true)}
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
        placeholder={`Paste your ${activeCategory.label} timetable or list tasks, e.g.\nMonday 10am Task 1 60m\nTuesday 7pm Task 2 90m...`}
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
          {loading ? 'Parsing plan...' : `Parse ${activeCategory.label} Plan`}
        </button>

        {error && (
          <div className="plan-input__error">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <TimetablePromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />

      <CategorySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        categories={categories}
        onSaveCategories={onSaveCategories}
      />
    </section>
  );
}
