import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Flame } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ExcelGoalsSheet({
  goals = [],
  onUpdateGoals,
  categories = [],
  schedule = {},
  taskStatuses = {},
  dayStatus = {},
  focusLogs = {},
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newTarget, setNewTarget] = useState('20');
  const [newUnit, setNewUnit] = useState('hrs');
  const [newCategory, setNewCategory] = useState('skill');

  const safeGoals = goals && goals.length > 0 ? goals : [];

  // Compute live progress and streaks for each goal
  const computedGoals = useMemo(() => {
    return safeGoals.map((goal) => {
      const goalCatLower = (goal.category || 'skill').toLowerCase();
      const goalNameLower = (goal.name || '').toLowerCase().trim();

      // Find matching category ID
      const matchedCat = (categories || []).find(
        (c) =>
          c.id.toLowerCase() === goalCatLower ||
          (c.label && c.label.toLowerCase().includes(goalCatLower)) ||
          goalCatLower.includes(c.id.toLowerCase())
      ) || (categories && categories[0]) || { id: 'skill', label: 'Career & Skills' };

      const catId = matchedCat.id;

      // Extract all matching tasks for this category & optional keyword
      let totalCompletedMins = 0;
      let totalCompletedCount = 0;

      // Add shared Pomodoro focus logs for this category
      const pomodoroMins = Number(focusLogs[catId]) || 0;
      totalCompletedMins += pomodoroMins;

      // Track active completion days for per-goal streak
      const activeDaysSet = new Set();

      (categories || []).forEach((cat) => {
        // If goal is category-specific, only inspect matching category tasks
        if (goalCatLower !== 'all' && cat.id !== catId) return;

        const tasks = schedule[cat.id] || [];
        tasks.forEach((t, idx) => {
          const taskId = `${cat.id}-${t.day}-${idx}`;
          const st = taskStatuses[taskId] || {};
          const status = st.status || 'pending';

          // Keyword filtering if goal name is specific (e.g. "React" or "SQL")
          const titleMatches =
            !goalNameLower ||
            t.title.toLowerCase().includes(goalNameLower) ||
            (st.note && st.note.toLowerCase().includes(goalNameLower));

          if (!titleMatches) return;

          const duration = Number(t.duration) || 30;
          const day = t.day || 'Monday';

          if (status === 'done') {
            totalCompletedMins += duration;
            totalCompletedCount += 1;
            activeDaysSet.add(day);
          } else if (status === 'partial') {
            // Partial tasks award 50% credit (or logged actual minutes if present)
            const actualMins = st.actualMinutes ? Number(st.actualMinutes) : Math.round(duration * 0.5);
            totalCompletedMins += actualMins;
            totalCompletedCount += 0.5;
            activeDaysSet.add(day);
          }
        });
      });

      // Unit-based progress percentage calculation
      const targetVal = Number(goal.target) || 1;
      const unitLower = (goal.unit || 'hrs').toLowerCase();
      let pct = 0;
      let progressDisplay = '';

      if (unitLower === 'hrs' || unitLower === 'hr' || unitLower === 'hours') {
        const completedHrs = (totalCompletedMins / 60).toFixed(1);
        pct = Math.min(100, Math.round((totalCompletedMins / (targetVal * 60)) * 100));
        progressDisplay = `${completedHrs} / ${targetVal} hrs`;
      } else if (unitLower === 'mins' || unitLower === 'minutes') {
        pct = Math.min(100, Math.round((totalCompletedMins / targetVal) * 100));
        progressDisplay = `${totalCompletedMins} / ${targetVal} mins`;
      } else {
        // Tasks / Classes / Sessions count goals
        const displayCount = Math.floor(totalCompletedCount);
        pct = Math.min(100, Math.round((totalCompletedCount / targetVal) * 100));
        progressDisplay = `${displayCount} / ${targetVal} ${goal.unit || 'tasks'}`;
      }

      // ── Goal-Specific Streak Calculation with Rest Day Buffers ──
      let goalStreak = 0;
      const todayIdx = new Date().getDay(); // 0 is Sun, 1 is Mon...
      const todayName = WEEKDAYS[(todayIdx + 6) % 7]; // Convert to Mon..Sun
      const todayPos = WEEKDAYS.indexOf(todayName);

      // Walk backwards up to 14 days
      for (let offset = 0; offset < 14; offset++) {
        const dayPos = (todayPos - offset + 14) % 7;
        const dayName = WEEKDAYS[dayPos];
        const statusType = dayStatus[dayName] || 'study';

        // Planned Rest Days / Holidays do NOT break streaks! (Streak skips over them)
        if (statusType === 'off' || statusType === 'holiday') {
          continue;
        }

        if (activeDaysSet.has(dayName)) {
          goalStreak += 1;
        } else {
          // If no activity on a scheduled study day, stop streak count
          if (offset > 0) break;
        }
      }

      return {
        ...goal,
        pct: isNaN(pct) ? 0 : pct,
        progressDisplay,
        streak: goalStreak,
        catLabel: matchedCat.label || goal.category,
      };
    });
  }, [safeGoals, categories, schedule, taskStatuses, dayStatus, focusLogs]);

  const handleAddGoal = () => {
    if (!newGoalName.trim()) return;

    const goalItem = {
      id: `goal_${Date.now()}`,
      name: newGoalName.trim(),
      target: Number(newTarget) || 1,
      unit: newUnit.trim() || 'hrs',
      category: newCategory,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: 0 }}>
          Goals & Habits
        </h2>
        <span style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>
          LIVE TRACKING ACTIVE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {computedGoals.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              borderRadius: 14,
              border: '1px dashed var(--hairline)',
              background: 'var(--paper-raised)',
              color: 'var(--slate)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500 }}>No active goals set yet</p>
            <span style={{ fontSize: 11 }}>Add a goal below (e.g. "DSA Practice: 20 hrs") to track live progress!</span>
          </div>
        ) : (
          computedGoals.map((g, i) => {
            const pct = g.pct;
            const barColor = pct === 100 ? 'var(--sage)' : i % 2 === 0 ? 'var(--indigo)' : 'var(--gold)';

            return (
              <div
                key={g.id}
                style={{
                  background: 'var(--paper-raised)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{g.name}</span>
                    {g.streak > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--rose)',
                          background: 'rgba(239, 68, 68, 0.12)',
                          padding: '2px 7px',
                          borderRadius: 999,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <Flame size={11} /> {g.streak}d streak
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--slate)' }}>
                      {g.progressDisplay}
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', opacity: 0.6 }}
                      title="Delete Goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div style={{ height: 7, borderRadius: 999, background: 'var(--hairline)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: barColor,
                      transition: 'width 0.4s ease-out',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--slate)' }}>
                  <span>Category: <strong>{g.catLabel}</strong></span>
                  <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--sage)' : 'var(--ink)' }}>
                    {pct === 100 ? '✓ Goal Achieved!' : `${pct}% Completed`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddForm ? (
        <div
          style={{
            marginTop: 14,
            background: 'var(--paper-raised)',
            border: '1px solid var(--hairline)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Create New Live Goal</h4>
          <input
            type="text"
            placeholder="Goal name (e.g. System Design or React)..."
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--hairline)',
              fontSize: 12,
              fontFamily: 'inherit',
              background: 'var(--paper)',
              color: 'var(--ink)',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              placeholder="Target"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              style={{
                width: 80,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                background: 'var(--paper)',
                color: 'var(--ink)',
              }}
            />
            <input
              type="text"
              placeholder="Unit (hrs, mins, tasks)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                fontSize: 12,
                background: 'var(--paper)',
                color: 'var(--ink)',
              }}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                fontSize: 12,
                background: 'var(--paper)',
                color: 'var(--ink)',
              }}
            >
              {(categories || []).map((cat) => (
                <option key={cat.id} value={cat.label}>{cat.label}</option>
              ))}
              <option value="all">All Categories</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={handleAddGoal}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--indigo)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Save Live Goal
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'transparent',
                fontSize: 12,
                cursor: 'pointer',
                color: 'var(--slate)',
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
            padding: '12px',
            borderRadius: 12,
            border: '1px dashed var(--hairline)',
            background: 'transparent',
            color: 'var(--slate)',
            fontSize: 12,
            fontFamily: 'inherit',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <Plus size={14} /> Add New Live Goal
        </button>
      )}
    </div>
  );
}

