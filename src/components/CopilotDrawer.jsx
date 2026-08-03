import React, { useState } from 'react';
import { Sparkles, X, Send, Lock, ArrowRight, Check, Calendar, CheckSquare, Bell } from 'lucide-react';
import {
  checkCopilotAccess,
  generateRescheduleProposal,
  generateMarkTaskProposal,
  generateExamDateProposal,
  generateAddNoteProposal,
  queryNotesVault,
  queryCopilotWithAPIKey,
  queryExamReadiness,
  queryWorkloadFrictionAudit,
} from '../services/copilotService';
import { sendBrowserNotification } from '../hooks/useTaskNotifications';
import { dateKey } from '../utils/dateUtils';

export default function CopilotDrawer({
  isOpen,
  onClose,
  user,
  schedule = {},
  onUpdateSchedule,
  notesArchive = [],
  subjectRegistry = {},
  onUpdateSubjectRegistry,
  taskStatuses = {},
  onUpdateTaskStatus,
  categories = [],
  onAddUserNote,
  focusLogs = {},
  semesterConfig = {},
  sleepLogs = {},
  onUpdateSleepLogs,
}) {
  const [hasAccess, setHasAccess] = React.useState(import.meta.env.DEV);

  React.useEffect(() => {
    if (import.meta.env.DEV) {
      setHasAccess(true);
      return;
    }
    if (!user) {
      setHasAccess(false);
      return;
    }
    checkCopilotAccess(user).then((res) => setHasAccess(!!res));
  }, [user]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hi! I am Dintaal AI Copilot. Ask me to reschedule classes, mark tasks done, update exam dates, add notes/reminders, or query your Notes Vault!',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    const qLower = textToSend.toLowerCase();

    // Feature: Add Note / Event via Chat
    if (
      qLower.includes('add note') ||
      qLower.includes('create note') ||
      qLower.includes('add event') ||
      qLower.includes('schedule note') ||
      (qLower.includes('note') && (qLower.includes('at') || qLower.includes('remind')))
    ) {
      const result = generateAddNoteProposal(textToSend, categories);
      if (result.type === 'proposal') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: 'Here is a proposed Note & Event reminder:', proposal: result.proposal },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: result.content },
        ]);
      }
      setIsProcessing(false);
      return;
    }

    // Feature: Mark Task Done / Partial via Chat
    if (
      qLower.includes('mark') ||
      qLower.includes('finished') ||
      qLower.includes('done') ||
      qLower.includes('partial') ||
      qLower.includes('complete')
    ) {
      const result = generateMarkTaskProposal(textToSend, schedule, taskStatuses, categories);
      if (result.type === 'multiProposals') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: result.message, proposals: result.proposals },
        ]);
      } else if (result.type === 'proposal') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: 'Here is a proposed status change for your task:', proposal: result.proposal },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: result.content },
        ]);
      }
      setIsProcessing(false);
      return;
    }

    // Feature: Set / Edit Exam Date via Chat
    if (qLower.includes('exam') && (qLower.includes('set') || qLower.includes('change') || qLower.includes('date') || qLower.includes('to'))) {
      const result = generateExamDateProposal(textToSend, subjectRegistry);
      if (result.type === 'proposal') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: 'Here is a proposed exam date update:', proposal: result.proposal },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: result.content },
        ]);
      }
      setIsProcessing(false);
      return;
    }

    // Feature: Smart Schedule Rescheduler (explicit keywords)
    if (qLower.includes('reschedule') || qLower.includes('shift') || qLower.includes('move')) {
      const result = generateRescheduleProposal(textToSend, schedule);
      if (result.type === 'proposal') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Here is a proposed schedule adjustment for your class:`,
            proposal: result.proposal,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: result.content },
        ]);
      }
      setIsProcessing(false);
      return;
    }

    // Feature #5: Daily Sleep Check-in
    if (qLower.includes('sleep') || qLower.includes('slept')) {
      const todayKey = dateKey(new Date());
      if (onUpdateSleepLogs) {
        onUpdateSleepLogs({
          ...sleepLogs,
          [todayKey]: {
            sleptOnSchedule: true,
            bedTime: '23:30',
            wakeTime: '07:00',
            loggedAt: new Date().toISOString(),
          },
        });
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: '🌙 **Sleep check-in recorded for today!**\nSlept on schedule (23:30 – 07:00). Earned **+25 pts** on your Daily Rhythm Score!',
        },
      ]);
      setIsProcessing(false);
      return;
    }

    // Feature #4: Exam Readiness & Subject Coverage Report
    if (qLower.includes('exam') || qLower.includes('readiness') || qLower.includes('coverage')) {
      const readinessReport = queryExamReadiness(subjectRegistry, schedule, taskStatuses);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: readinessReport },
      ]);
      setIsProcessing(false);
      return;
    }

    // Feature #1: Rhythm & Workload Friction Audit (with Guardrail)
    if (qLower.includes('audit') || qLower.includes('friction') || qLower.includes('bottleneck')) {
      const auditReport = queryWorkloadFrictionAudit(schedule, taskStatuses, focusLogs);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: auditReport },
      ]);
      setIsProcessing(false);
      return;
    }

    // Notes Vault search
    if (qLower.includes('summary') || qLower.includes('react') || qLower.includes('dsa') || qLower.includes('search note')) {
      const answer = queryNotesVault(textToSend, notesArchive);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: answer },
      ]);
      setIsProcessing(false);
      return;
    }

    // Fallback: Try External Serverless Function (/api/copilot) for Open-Ended Q&A
    const llmResult = await queryCopilotWithAPIKey(textToSend, schedule, notesArchive);
    if (llmResult) {
      if (llmResult.type === 'proposal') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: 'Here is a proposed schedule adjustment:', proposal: llmResult.proposal, modelUsed: llmResult.modelUsed },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: llmResult.content, modelUsed: llmResult.modelUsed },
        ]);
      }
      setIsProcessing(false);
      return;
    }

    // Default Rescheduler fallback if no LLM key
    const result = generateRescheduleProposal(textToSend, schedule);
    if (result.type === 'proposal') {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Here is a proposed schedule adjustment for your class:`,
          proposal: result.proposal,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: result.content },
      ]);
    }
    setIsProcessing(false);
    setIsProcessing(false);
  };

  const handleApplyProposal = (proposal) => {
    if (proposal.proposalKind === 'addNoteEvent') {
      const { noteTitle, catId, catLabel, eventTime, eventDate, hasReminder, content } = proposal;
      const newNote = {
        id: `note_${Date.now()}`,
        title: noteTitle,
        catId,
        catLabel,
        content: content || `Scheduled event: ${noteTitle} at ${eventTime}`,
        eventTime,
        eventDate,
        hasReminder,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isCustom: true,
      };

      if (onAddUserNote) onAddUserNote(newNote);

      if (hasReminder) {
        sendBrowserNotification(`🔔 Event Reminder: ${noteTitle}`, {
          body: `Scheduled for ${eventTime} today. Note saved to Notes Vault!`,
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: `✓ Applied! Saved note "${noteTitle}" (${eventTime})${hasReminder ? ' with notification reminder active 🔔' : ''}.`,
        },
      ]);
    } else if (proposal.proposalKind === 'taskStatus') {
      const { taskId, newStatus, taskTitle } = proposal;
      if (onUpdateTaskStatus) {
        onUpdateTaskStatus(taskId, newStatus);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: `✓ Applied! Marked "${taskTitle}" as ${newStatus.toUpperCase()}.`,
        },
      ]);
    } else if (proposal.proposalKind === 'examDate') {
      const { catId, subjectId, subjectName, newExamDate, formattedNewDate } = proposal;
      if (onUpdateSubjectRegistry) {
        const catSubjects = [...(subjectRegistry[catId] || [])];
        const updatedSubjects = catSubjects.map((s) =>
          s.id === subjectId ? { ...s, examDate: newExamDate } : s
        );
        onUpdateSubjectRegistry({
          ...subjectRegistry,
          [catId]: updatedSubjects,
        });
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: `✓ Applied! Set exam date for "${subjectName}" to ${formattedNewDate || newExamDate}.`,
        },
      ]);
    } else {
      // Reschedule proposal
      const { catId, taskIndex, newTime } = proposal;
      const catTasks = [...(schedule[catId] || [])];
      if (catTasks[taskIndex]) {
        catTasks[taskIndex] = { ...catTasks[taskIndex], time: newTime };
        onUpdateSchedule({ ...schedule, [catId]: catTasks });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `✓ Applied! Rescheduled "${proposal.originalTitle}" to ${newTime}.`,
          },
        ]);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: 420,
        background: 'var(--paper-raised)',
        borderLeft: '1px solid var(--hairline)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
        zIndex: 10006,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--paper)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} style={{ color: 'var(--indigo)' }} />
          <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 16, margin: 0 }}>
            Dintaal AI Copilot <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>BETA</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body: Locked State for Non-Whitelisted Users */}
      {!hasAccess ? (
        <div
          style={{
            flex: 1,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--indigo)',
            }}
          >
            <Lock size={26} />
          </div>
          <h4 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: 0 }}>
            Coming Soon (Limited Beta)
          </h4>
          <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0, lineHeight: 1.5 }}>
            Cadence AI Copilot is currently in private preview for select early testers. Smart Rescheduling and Notes Q&A will be available to all users soon!
          </p>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user' ? 'var(--indigo)' : 'var(--paper)',
                  color: m.sender === 'user' ? '#FFFFFF' : 'var(--ink)',
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontSize: 13,
                  border: m.sender === 'user' ? 'none' : '1px solid var(--hairline)',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                {m.sender === 'ai' && m.modelUsed && (
                  <span style={{ fontSize: 9, opacity: 0.6, marginTop: 4, display: 'block', fontFamily: 'var(--font-mono)' }}>
                    {m.modelUsed}
                  </span>
                )}

                {/* Single Proposal Card */}
                {m.proposal && (
                  <div
                    style={{
                      marginTop: 10,
                      background: 'var(--paper-raised)',
                      border: '1.5px solid var(--indigo)',
                      borderRadius: 12,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      color: 'var(--ink)',
                    }}
                  >
                    {m.proposal.proposalKind === 'addNoteEvent' && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{m.proposal.noteTitle}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          <strong style={{ color: 'var(--indigo)' }}>{m.proposal.eventTime}</strong>
                          <span>({m.proposal.catLabel})</span>
                          {m.proposal.hasReminder && (
                            <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Bell size={10} /> Reminder Active
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--slate)' }}>{m.proposal.reason}</span>
                      </>
                    )}

                    {m.proposal.proposalKind === 'taskStatus' && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{m.proposal.taskTitle} ({m.proposal.categoryLabel})</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          <span style={{ textTransform: 'uppercase', opacity: 0.6 }}>{m.proposal.currentStatus}</span>
                          <ArrowRight size={12} style={{ color: 'var(--indigo)' }} />
                          <strong style={{ color: 'var(--indigo)', textTransform: 'uppercase' }}>{m.proposal.newStatus}</strong>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--slate)' }}>{m.proposal.reason}</span>
                      </>
                    )}

                    {m.proposal.proposalKind === 'examDate' && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{m.proposal.subjectName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{m.proposal.oldExamDate}</span>
                          <ArrowRight size={12} style={{ color: 'var(--indigo)' }} />
                          <strong style={{ color: 'var(--indigo)' }}>{m.proposal.formattedNewDate || m.proposal.newExamDate}</strong>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--slate)' }}>{m.proposal.reason}</span>
                      </>
                    )}

                    {(!m.proposal.proposalKind || m.proposal.proposalKind === 'reschedule') && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{m.proposal.originalTitle}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{m.proposal.originalTime}</span>
                          <ArrowRight size={12} style={{ color: 'var(--indigo)' }} />
                          <strong style={{ color: 'var(--indigo)' }}>{m.proposal.newTime}</strong>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--slate)' }}>{m.proposal.reason}</span>
                      </>
                    )}

                    <button
                      onClick={() => handleApplyProposal(m.proposal)}
                      style={{
                        marginTop: 4,
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'var(--indigo)',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <Check size={12} /> Confirm & Apply Change
                    </button>
                  </div>
                )}

                {/* Multiple Proposals Card (Ambiguity Resolution) */}
                {m.proposals && Array.isArray(m.proposals) && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.proposals.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          background: 'var(--paper-raised)',
                          border: '1px solid var(--hairline)',
                          borderRadius: 10,
                          padding: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          color: 'var(--ink)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{p.taskTitle} ({p.day})</div>
                          <div style={{ fontSize: 10, color: 'var(--slate)' }}>
                            Status: <span style={{ textTransform: 'uppercase' }}>{p.currentStatus}</span> → <strong style={{ color: 'var(--indigo)', textTransform: 'uppercase' }}>{p.newStatus}</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplyProposal(p)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--indigo)',
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Check size={11} /> Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div style={{ fontSize: 12, color: 'var(--slate)', fontStyle: 'italic' }}>
                Dintaal Copilot is thinking...
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--hairline)',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {[
              'Shift 10am class to evening',
              'Mark task done',
              'Set exam date to Oct 15',
              'Show exam readiness report',
              'Run workload friction audit',
              'Summarize React Hooks note',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--hairline)',
                  background: 'var(--paper)',
                  fontSize: 11,
                  cursor: 'pointer',
                  color: 'var(--slate)',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: 12,
              borderTop: '1px solid var(--hairline)',
              display: 'flex',
              gap: 8,
              background: 'var(--paper)',
            }}
          >
            <input
              type="text"
              placeholder="Reschedule class, mark task done, set exam date, or ask notes..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--hairline)',
                fontSize: 12,
                fontFamily: 'inherit',
                background: 'var(--paper-raised)',
                color: 'var(--ink)',
              }}
            />
            <button
              onClick={() => handleSend()}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--indigo)',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
