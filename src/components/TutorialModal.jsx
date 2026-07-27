import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Bot, CalendarCheck, GraduationCap, Timer } from 'lucide-react';

export default function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const STEPS = [
    {
      title: '1. Choose How to Add Schedules',
      icon: <Bot size={22} className="modal-icon modal-icon--college" />,
      content: (
        <div className="tutorial-step-content">
          <p>Go to the <strong>⚙️ Setup</strong> tab to add your timetables in 2 easy ways:</p>
          <ul>
            <li><strong>Option A (AI Mode):</strong> Copy our prompt template, paste it in ChatGPT/Gemini along with your timetable image, and paste the clean output into Dintaal!</li>
            <li><strong>Option B (Manual Mode):</strong> Add classes and study slots directly with our simple form builder (Title, Day, Time, Duration).</li>
          </ul>
        </div>
      ),
    },
    {
      title: '2. Today View & Task Management',
      icon: <CalendarCheck size={22} className="modal-icon modal-icon--study" />,
      content: (
        <div className="tutorial-step-content">
          <p>Your <strong>📅 Today</strong> screen is your daily focused timeline:</p>
          <ul>
            <li><strong>Status Cycling:</strong> Tap any task status button to cycle between 🟢 <code>Done</code> → 🟡 <code>Partial</code> → 🔴 <code>Skipped</code> → ⚪ <code>Pending</code>.</li>
            <li><strong>Editable Times:</strong> Click on any task's start time (e.g. <code>19:00 (90m)</code>) to edit the time or duration inline!</li>
            <li><strong>Notes & Homework:</strong> Click the 📝 note icon on any task card to add homework or class reminders.</li>
          </ul>
        </div>
      ),
    },
    {
      title: '3. College Timetable & Overview',
      icon: <GraduationCap size={22} className="modal-icon modal-icon--college" />,
      content: (
        <div className="tutorial-step-content">
          <p>Keep your college classes organized without overwriting skill roadmaps:</p>
          <ul>
            <li><strong>College Completed Button:</strong> Tap <code>College Completed (✓)</code> to mark all today's lectures completed in 1 click!</li>
            <li><strong>College Overview Grid:</strong> Click <code>Overview</code> to view your full Monday–Sunday lecture schedule grid with active homework notes.</li>
          </ul>
        </div>
      ),
    },
    {
      title: '4. Pomodoro Focus Timer',
      icon: <Timer size={22} className="modal-icon modal-icon--gym" />,
      content: (
        <div className="tutorial-step-content">
          <p>Track focus & study sessions:</p>
          <ul>
            <li><strong>Pomodoro Timer:</strong> Use the <strong>⏱️ Focus</strong> tab for 25m study sessions with automatic break reminders and session counters.</li>
          </ul>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const activeStep = STEPS[currentStep];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tutorial-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {activeStep.icon}
            <div>
              <h3>{activeStep.title}</h3>
              <span className="modal-subtitle">Step {currentStep + 1} of {STEPS.length}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body tutorial-modal-body">
          {activeStep.content}
        </div>

        <div className="modal-footer tutorial-modal-footer">
          {currentStep > 0 && (
            <button className="cadence-btn" onClick={handlePrev}>
              <ChevronLeft size={16} /> Back
            </button>
          )}

          <button className="cadence-btn cadence-btn--primary tutorial-next-btn" onClick={handleNext}>
            <span>{currentStep === STEPS.length - 1 ? 'Got it!' : 'Next'}</span>
            {currentStep < STEPS.length - 1 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
