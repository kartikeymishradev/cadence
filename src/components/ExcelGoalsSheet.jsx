import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function ExcelGoalsSheet({ goals = [], onUpdateGoals }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newTarget, setNewTarget] = useState('20');
  const [newUnit, setNewUnit] = useState('hrs');
  const [newCategory, setNewCategory] = useState('Skill');

  const safeGoals = goals && goals.length > 0 ? goals : [];

  const handleAddGoal = () => {
    if (!newGoalName.trim()) return;

    const goalItem = {
      id: `goal_${Date.now()}`,
      name: newGoalName.trim(),
      target: Number(newTarget) || 1,
      unit: newUnit,
      category: newCategory,
      pct: 0,
    };

    if (onUpdateGoals) {
      onUpdateGoals([...safeGoals, goalItem]);
    }
    setNewGoalName('');
    setShowAddForm(false);
  };

  const handleDeleteGoal = (goalId) => {
    const updated = safeGoals.filter((g) => g.id !== goalId);
    if (onUpdateGoals) {
      onUpdateGoals(updated);
    }
  };

  return (
    <div style={{ padding: '4px 0 18px' }}>
      <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: '0 0 12px' }}>
        Goals & Habits
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {safeGoals.map((g, i) => {
          const pct = g.pct !== undefined ? g.pct : (g.status?.monthly === 'done' ? 100 : g.status?.monthly === 'partial' ? 50 : 0);
          const barColor = pct === 100 ? 'var(--sage)' : i % 2 === 0 ? 'var(--indigo)' : 'var(--gold)';

          return (
            <div
              key={g.id}
              style={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--hairline)',
                borderRadius: 14,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                    {g.target} {g.unit || ''}
                  </span>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', opacity: 0.6 }}
                    title="Delete Goal"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div style={{ height: 6, borderRadius: 999, background: 'var(--hairline)', overflow: 'hidden', marginBottom: 6 }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: barColor,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--slate)' }}>{g.category || 'Skill'} &middot; {pct}%</span>
            </div>
          );
        })}
      </div>

      {showAddForm ? (
        <div
          style={{
            marginTop: 14,
            background: 'var(--paper-raised)',
            border: '1px solid var(--hairline)',
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <input
            type="text"
            placeholder="Goal name (e.g. System Design)..."
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--hairline)',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              placeholder="Target"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              style={{
                width: 70,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <input
              type="text"
              placeholder="Unit (hrs, books)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                fontSize: 12,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddGoal}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--indigo)',
                color: 'var(--paper)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Save Goal
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'transparent',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            marginTop: 14,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px',
            borderRadius: 10,
            border: '1px dashed var(--hairline)',
            background: 'transparent',
            color: 'var(--slate)',
            fontSize: 12,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add Custom Goal
        </button>
      )}
    </div>
  );
}
