import React, { useState } from 'react';
import { Copy, Check, X, Image } from 'lucide-react';

const TIMETABLE_PROMPT =
  'Extract only the weekly schedule from this timetable image. Format as a clean text list with Day, Start Time (24hr HH:MM), Duration in minutes, and Task Title for each slot.';

export default function TimetablePromptModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(TIMETABLE_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Image size={20} className="modal-icon" />
            <h3>Timetable Image Helper</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Have an image of a study or class timetable? Copy this prompt and paste it along with your image into <strong>ChatGPT</strong>, <strong>Gemini</strong>, or <strong>Claude</strong>:
          </p>

          <div className="prompt-box">
            <code>{TIMETABLE_PROMPT}</code>
          </div>

          <p className="modal-subtext">
            Then copy the clean text response from the AI and paste it directly into Dintaal's plan box to generate your schedule!
          </p>
        </div>

        <div className="modal-footer">
          <button className="cadence-btn modal-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied Prompt!' : 'Copy Prompt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
