import React, { useState } from 'react';
import { Check, X, Minus, Plus, Trash2, Calendar, Target, Award, PieChart, Layers } from 'lucide-react';

export default function ExcelGoalsSheet({ goals, onUpdateGoals }) {
  const [timeRange, setTimeRange] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [newGoalName, setNewGoalName] = useState('');
  const [newTarget, setNewTarget] = useState('1');
  const [newUnit, setNewUnit] = useState('hrs');
  const [newCategory, setNewCategory] = useState('Skill');

  const handleAddGoal = () => {
    if (!newGoalName.trim()) return;

    const goalItem = {
      id: `goal_${Date.now()}`,
      name: newGoalName.trim(),
      target: Number(newTarget) || 1,
      unit: newUnit,
      category: newCategory,
      status: {
        daily: 'pending',
        weekly: 'pending',
        monthly: 'pending',
      },
    };

    onUpdateGoals([...goals, goalItem]);
    setNewGoalName('');
  };

  const handleStatusChange = (goalId, newStatus) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          status: {
            ...(g.status || {}),
            [timeRange]: newStatus,
          },
        };
      }
      return g;
    });
    onUpdateGoals(updated);
  };

  const handleDeleteGoal = (goalId) => {
    const updated = goals.filter((g) => g.id !== goalId);
    onUpdateGoals(updated);
  };

  // Metrics calculation
  const total = goals.length;
  const completed = goals.filter((g) => g.status?.[timeRange] === 'done').length;
  const inProgress = goals.filter((g) => g.status?.[timeRange] === 'partial').length;
  const failed = goals.filter((g) => g.status?.[timeRange] === 'failed').length;

  const completionPct = total > 0 ? Math.round(((completed + inProgress * 0.5) / total) * 100) : 0;

  return (
    <div className="excel-goals-container">
      {/* Header & Controls */}
      <div className="excel-goals-header">
        <div className="excel-goals-title">
          <Target size={22} className="goals-icon" />
          <div>
            <h2>Interactive Goals & Habit Sheet</h2>
            <span className="goals-subtitle">Track custom daily, weekly & monthly targets</span>
          </div>
        </div>

        {/* View Switcher: Daily | Weekly | Monthly */}
        <div className="goals-range-switcher">
          <button
            className={`range-btn ${timeRange === 'daily' ? 'range-btn--active' : ''}`}
            onClick={() => setTimeRange('daily')}
          >
            Daily Sheet
          </button>
          <button
            className={`range-btn ${timeRange === 'weekly' ? 'range-btn--active' : ''}`}
            onClick={() => setTimeRange('weekly')}
          >
            Weekly Sheet
          </button>
          <button
            className={`range-btn ${timeRange === 'monthly' ? 'range-btn--active' : ''}`}
            onClick={() => setTimeRange('monthly')}
          >
            Monthly Sheet
          </button>
        </div>
      </div>

      {/* Progress & Overview Card */}
      <div className="cadence-card goals-summary-card">
        <div className="goals-summary-main">
          <div className="goals-summary-metric">
            <span className="metric-label">{timeRange.toUpperCase()} COMPLETION</span>
            <div className="metric-val-row">
              <strong className="metric-val">{completionPct}%</strong>
              <span className="metric-count">({completed}/{total} Completed)</span>
            </div>
          </div>
          <div className="goals-progress-bar">
            <div className="goals-progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        <div className="goals-summary-tags">
          <span className="tag-stat tag-stat--done"><Check size={12} /> {completed} Done</span>
          <span className="tag-stat tag-stat--partial"><Minus size={12} /> {inProgress} In Progress</span>
          <span className="tag-stat tag-stat--failed"><X size={12} /> {failed} Incomplete</span>
        </div>
      </div>

      {/* Excel Sheet Table */}
      <div className="excel-table-wrapper">
        <table className="excel-table">
          <thead>
            <tr>
              <th>Goal / Habit Name</th>
              <th>Category</th>
              <th>Target</th>
              <th>Status Action ({timeRange.toUpperCase()})</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr>
                <td colSpan={5} className="excel-table-empty">
                  No custom goals added yet. Use the form below to create your first goal!
                </td>
              </tr>
            ) : (
              goals.map((g) => {
                const currentStatus = g.status?.[timeRange] || 'pending';

                return (
                  <tr key={g.id} className={`excel-row excel-row--${currentStatus}`}>
                    <td className="excel-cell-name">
                      <strong>{g.name}</strong>
                    </td>
                    <td>
                      <span className="excel-category-badge">{g.category || 'General'}</span>
                    </td>
                    <td className="excel-cell-target">
                      {g.target} {g.unit}
                    </td>
                    <td className="excel-cell-status">
                      <div className="status-selector-group">
                        <button
                          className={`status-chip status-chip--done ${currentStatus === 'done' ? 'status-chip--active' : ''}`}
                          onClick={() => handleStatusChange(g.id, 'done')}
                          title="Mark Completed"
                        >
                          <Check size={14} /> Completed
                        </button>

                        <button
                          className={`status-chip status-chip--partial ${currentStatus === 'partial' ? 'status-chip--active' : ''}`}
                          onClick={() => handleStatusChange(g.id, 'partial')}
                          title="Mark In Progress"
                        >
                          <Minus size={14} /> In Progress
                        </button>

                        <button
                          className={`status-chip status-chip--failed ${currentStatus === 'failed' ? 'status-chip--active' : ''}`}
                          onClick={() => handleStatusChange(g.id, 'failed')}
                          title="Mark Incomplete"
                        >
                          <X size={14} /> Incomplete
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="excel-delete-btn"
                        onClick={() => handleDeleteGoal(g.id)}
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Goal Bar */}
      <div className="excel-add-goal-bar">
        <h4>Add Custom Goal / Habit</h4>
        <div className="add-goal-inputs">
          <input
            type="text"
            className="add-goal-input"
            placeholder="e.g. SQL Practice / Gym Workout / Book Reading"
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
          />

          <input
            type="number"
            className="add-goal-target-num"
            placeholder="Target"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
          />

          <select
            className="add-goal-select"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
          >
            <option value="hrs">hrs</option>
            <option value="sessions">sessions</option>
            <option value="tasks">tasks</option>
            <option value="pages">pages</option>
          </select>

          <select
            className="add-goal-select"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            <option value="Skill">Skill</option>
            <option value="College">College</option>
            <option value="Gym & Diet">Gym & Diet</option>
            <option value="General">General</option>
          </select>

          <button className="cadence-btn add-goal-btn" onClick={handleAddGoal} disabled={!newGoalName.trim()}>
            <Plus size={14} /> Add Goal
          </button>
        </div>
      </div>
    </div>
  );
}
