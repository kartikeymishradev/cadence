import React, { useState } from 'react';
import { Sparkles, AlertCircle, Image, Settings, Plus, Wrench, Bot, Copy, Check, Info } from 'lucide-react';
import TimetablePromptModal from './TimetablePromptModal';
import CategorySettingsModal from './CategorySettingsModal';

const PROMPT_TEMPLATE = `Extract only the weekly timetable from this text or image. Format each item as a clean list with:
Day: [Monday..Sunday]
Start Time: [HH:MM 24-hr]
Duration: [minutes]
Title: [Task name]`;

export default function PlanInput({
  tab,
  setTab,
  categories,
  onSaveCategories,
  rawText,
  onRawTextChange,
  onParse,
  onAddTaskManual,
  loading,
  error,
}) {
  const [setupMode, setSetupMode] = useState('ai'); // 'ai' | 'manual'
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [parseInitiated, setParseInitiated] = useState(false);

  // Manual task form state
  const [manualDay, setManualDay] = useState('Monday');
  const [manualTitle, setManualTitle] = useState('');
  const [manualStart, setManualStart] = useState('10:00');
  const [manualDur, setManualDur] = useState('60');

  const activeCategory = categories.find((c) => c.id === tab) || categories[0] || { label: 'Plan' };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleSafeParse = async () => {
    if (loading || parseInitiated || !rawText.trim()) return;

    setParseInitiated(true);
    try {
      if (onParse) {
        await onParse();
      }
    } finally {
      setParseInitiated(false);
    }
  };

  const handleCreateTask = () => {
    if (!manualTitle.trim()) return;
    if (onAddTaskManual) {
      onAddTaskManual(tab, {
        day: manualDay,
        title: manualTitle.trim(),
        start: manualStart,
        duration: Number(manualDur) || 60,
      });
    }
    setManualTitle('');
  };

  const isBtnDisabled = loading || parseInitiated || !rawText.trim();

  return (
    <section className="cadence-card plan-input">
      {/* Category Tabs & Settings */}
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
          Timetable Image Prompt
        </button>
      </div>

      {/* Mode Switcher: AI Mode vs Manual Mode */}
      <div className="setup-mode-switcher">
        <button
          className={`setup-mode-btn ${setupMode === 'ai' ? 'setup-mode-btn--active' : ''}`}
          onClick={() => setSetupMode('ai')}
        >
          <Bot size={15} />
          Option A: AI Parse Mode (Fast)
        </button>

        <button
          className={`setup-mode-btn ${setupMode === 'manual' ? 'setup-mode-btn--active' : ''}`}
          onClick={() => setSetupMode('manual')}
        >
          <Wrench size={15} />
          Option B: Build Yourself (Manual)
        </button>
      </div>

      {/* OPTION A: AI PARSE MODE */}
      {setupMode === 'ai' && (
        <div className="setup-ai-container">
          <div className="prompt-template-banner">
            <div className="prompt-template-info">
              <span><strong>LLM Prompt Template:</strong> Copy this prompt to ChatGPT/Gemini along with your timetable:</span>
            </div>
            <button className="cadence-btn prompt-copy-chip" onClick={handleCopyPrompt}>
              {copiedPrompt ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
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

          {parseInitiated && (
            <div className="parse-confirmation-toast">
              <Info size={14} className="spin" />
              <span>Parsing initiated! Please wait 2-3 seconds for AI to format your schedule...</span>
            </div>
          )}

          <div className="plan-input__actions">
            <button
              id="btn-parse-ai"
              className="cadence-btn cadence-btn--primary"
              onClick={handleSafeParse}
              disabled={isBtnDisabled}
            >
              <Sparkles size={16} className={isBtnDisabled ? 'spin' : ''} />
              {isBtnDisabled ? `Parsing ${activeCategory.label} with AI...` : `Parse ${activeCategory.label} with AI`}
            </button>

            {error && (
              <div className="plan-input__error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OPTION B: MANUAL BUILD MODE */}
      {setupMode === 'manual' && (
        <div className="setup-manual-container">
          <h4>Add Task Directly to {activeCategory.label}</h4>
          <div className="manual-task-form">
            <select
              className="manual-input"
              value={manualDay}
              onChange={(e) => setManualDay(e.target.value)}
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input
              type="text"
              className="manual-input manual-input--title"
              placeholder="Task / Class Title (e.g. NCS 401)"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
            />

            <input
              type="time"
              className="manual-input"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
            />

            <div className="manual-dur-group">
              <input
                type="number"
                className="manual-input manual-input--dur"
                placeholder="60"
                value={manualDur}
                onChange={(e) => setManualDur(e.target.value)}
              />
              <span className="dur-unit">mins</span>
            </div>

            <button
              className="cadence-btn cadence-btn--primary manual-add-btn"
              onClick={handleCreateTask}
              disabled={!manualTitle.trim()}
            >
              <Plus size={15} />
              Add Task
            </button>
          </div>
        </div>
      )}

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
