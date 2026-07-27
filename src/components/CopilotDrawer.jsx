import React, { useState } from 'react';
import { Sparkles, X, Send, Lock, ArrowRight, Check } from 'lucide-react';
import { checkCopilotAccess, generateRescheduleProposal, queryNotesVault, queryCopilotWithAPIKey } from '../services/copilotService';

export default function CopilotDrawer({
  isOpen,
  onClose,
  user,
  schedule = {},
  onUpdateSchedule,
  notesArchive = [],
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hi! I am Dintaal AI Copilot. Ask me to reschedule missed classes or query your Notes Vault!',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const hasAccess = checkCopilotAccess(user);

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    // 1. Try Serverless Function (/api/copilot)
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

    // 2. Instant Local Smart Heuristic fallback (0ms delay)
    const qLower = textToSend.toLowerCase();
    if (qLower.includes('note') || qLower.includes('summary') || qLower.includes('react') || qLower.includes('dsa')) {
      const answer = queryNotesVault(textToSend, notesArchive);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: answer },
      ]);
    } else {
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
    }
    setIsProcessing(false);
  };

  const handleApplyProposal = (proposal) => {
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

                {/* Proposal Card */}
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
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.proposal.originalTitle}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{m.proposal.originalTime}</span>
                      <ArrowRight size={12} style={{ color: 'var(--indigo)' }} />
                      <strong style={{ color: 'var(--indigo)' }}>{m.proposal.newTime}</strong>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--slate)' }}>{m.proposal.reason}</span>

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
              'Missed 10am class, shift to evening',
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
              placeholder="Ask Copilot to reschedule or search notes..."
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
