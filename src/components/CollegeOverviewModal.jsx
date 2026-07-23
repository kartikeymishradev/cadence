import React from 'react';
import { X, GraduationCap, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { WEEKDAYS } from '../utils/constants';

export default function CollegeOverviewModal({
  isOpen,
  onClose,
  collegeSchedule,
  taskStatuses,
}) {
  if (!isOpen) return null;

  const totalClasses = collegeSchedule.length;
  const totalDurationMin = collegeSchedule.reduce(
    (sum, t) => sum + (Number(t.duration) || 60),
    0
  );
  const totalHours = (totalDurationMin / 60).toFixed(1);

  // Group classes by day of week
  const scheduleByDay = WEEKDAYS.map((day) => ({
    day,
    classes: collegeSchedule
      .filter((t) => t.day === day)
      .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00')),
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <GraduationCap size={22} className="modal-icon modal-icon--college" />
            <div>
              <h3>College Overview</h3>
              <span className="modal-subtitle">{totalClasses} total classes • {totalHours} hrs / week</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body college-overview-body">
          {totalClasses === 0 ? (
            <div className="college-overview-empty">
              <p>No college timetable parsed yet. Go to Week View → College tab to paste your class schedule.</p>
            </div>
          ) : (
            <div className="college-grid">
              {scheduleByDay.map(({ day, classes }) => (
                <div key={day} className={`college-day-column ${classes.length === 0 ? 'college-day-column--empty' : ''}`}>
                  <div className="college-day-header">
                    <h4>{day}</h4>
                    <span className="college-day-count">{classes.length} classes</span>
                  </div>

                  <div className="college-day-classes">
                    {classes.length === 0 ? (
                      <span className="college-no-class">No classes</span>
                    ) : (
                      classes.map((c, i) => {
                        const taskId = `college-${i}`;
                        const taskState = taskStatuses[taskId] || {};
                        const noteText = taskState.note;
                        const isDone = taskState.status === 'done';

                        return (
                          <div
                            key={i}
                            className={`college-class-card ${isDone ? 'college-class-card--done' : ''}`}
                          >
                            <div className="college-class-time">
                              <Clock size={12} />
                              <span>{c.start || 'TBD'}</span>
                              {c.duration && <span className="dur">({c.duration}m)</span>}
                            </div>
                            <strong className="college-class-title">{c.title}</strong>

                            {noteText && (
                              <div className="college-class-note">
                                <FileText size={10} />
                                <span>{noteText}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cadence-btn cadence-btn--primary" onClick={onClose}>
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
