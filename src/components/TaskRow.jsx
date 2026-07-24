import React from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';

function statusColor(actual, planned) {
  if (!actual) return 'var(--slate)';
  if (actual < planned) return 'var(--gold)';
  return 'var(--sage)';
}

export default function TaskRow({
  task,
  taskStatus,
  actual,
  status,
  onQuickToggle,
  onActualChange,
}) {
  const planned = Number(task.duration) || 0;
  const isDone = taskStatus?.status === 'done' || (actual !== undefined && actual !== '' && Number(actual) >= planned);
  const actualNum = actual !== undefined && actual !== '' ? Number(actual) : (isDone ? planned : 0);
  const over = actualNum > planned && planned > 0;

  return (
    <div className={`task-row ${status === 'off' ? 'task-row--dimmed' : ''}`}>
      <div
        className="task-row__toggle"
        onClick={() => onQuickToggle(task.id, planned)}
      >
        {isDone ? (
          <CheckCircle2 size={17} color="var(--sage)" />
        ) : (
          <Circle size={17} color={statusColor(actualNum, planned)} />
        )}
      </div>
      <span className="task-row__time">{task.start || '--:--'}</span>
      <span className="task-row__title">{task.title}</span>
      <input
        className="cadence-minutes"
        type="number"
        min="0"
        step="5"
        value={actual !== undefined && actual !== '' ? actual : (isDone ? planned : '')}
        onChange={(e) =>
          onActualChange(
            task.id,
            e.target.value === '' ? '' : Number(e.target.value)
          )
        }
        placeholder={planned ? String(planned) : '0'}
      />
      <span
        className={`task-row__planned ${over ? 'task-row__planned--over' : ''}`}
      >
        /{planned}m{over ? ' \u00b7 over' : ''}
      </span>
    </div>
  );
}
