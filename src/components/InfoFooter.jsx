import React from 'react';
import { Info } from 'lucide-react';
import { cloudSave } from '../services/cloudSync';
import { startOfWeek, dateKey } from '../utils/dateUtils';

export default function InfoFooter({ viewMode }) {
  const injectDemoData = async () => {
    const PREFIX = 'cadence_';
    const currentMonday = startOfWeek(new Date());

    const dummyTaskStatuses = {};
    const dummyMacros = { proteinTaken: 140, proteinTarget: 150, carbsTaken: 200, carbsTarget: 220, fatsTaken: 50, fatsTarget: 60 };

    for (let i = 0; i < 4; i++) {
      const weekDate = new Date(currentMonday);
      weekDate.setDate(currentMonday.getDate() - (i * 7));
      const dateStr = dateKey(weekDate);

      const dayStatusObj = {};
      const generatedSkill = [];
      const generatedGym = [];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      days.forEach((d, idx) => {
        dayStatusObj[d] = Math.random() > 0.2 ? 'done' : 'partial';
        generatedSkill.push({ id: `s-${i}-${idx}`, title: 'React Revision', start: '18:00', duration: 60, day: d });
        generatedGym.push({ id: `g-${i}-${idx}`, title: 'Chest & Triceps', start: '07:00', duration: 90, day: d });
        dummyTaskStatuses[`s-${i}-${idx}`] = { status: 'done' };
        dummyTaskStatuses[`g-${i}-${idx}`] = { status: 'done' };
      });

      const dummySchedule = {
        skill: generatedSkill,
        gym: generatedGym,
      };

      const payload = {
        schedule: dummySchedule,
        taskStatuses: dummyTaskStatuses,
        dayStatus: dayStatusObj,
        macros: dummyMacros,
        streak: 30,
        categories: [
          { id: 'skill', label: 'Skill Prep', icon: 'BookOpen', color: '#5F8467' },
          { id: 'gym', label: 'Gym & Diet', icon: 'Dumbbell', color: '#C9922B' }
        ]
      };

      // Set to localStorage
      Object.entries(payload).forEach(([k, v]) => {
        localStorage.setItem(`${PREFIX}${dateStr}_${k}`, JSON.stringify(v));
      });

      // Force Cloud Save for this week and await completion!
      await cloudSave(dateStr, payload);
    }

    localStorage.setItem('cadence_user_streak', '30');

    alert('✅ 1 Month Dummy Data Injected & Synced! Reloading...');
    window.location.reload();
  };

  const renderFooterContent = () => {
    if (viewMode === 'goals') {
      return (
        <p className="info-footer__text">
          Use the Daily, Weekly, and Monthly switches to manage your habit & targets. Click Completed (✓), In Progress (-), or Incomplete (✕) to update live percentage completion.
        </p>
      );
    }
    if (viewMode === 'focus') {
      return (
        <p className="info-footer__text">
          Use the Pomodoro Focus Timer during your 25m study blocks. Sound alerts will notify you when it's time for a 5m short break.
        </p>
      );
    }
    if (viewMode === 'today') {
      return (
        <p className="info-footer__text">
          Tap any status button to cycle between Done, Partial, or Skipped. Click any start time stamp to edit time & duration inline.
        </p>
      );
    }
    return (
      <p className="info-footer__text">
        Tap a task's status to mark it fully done or partial. The progress chart reflects your logged hours across all categories.
      </p>
    );
  };

  return (
    <div className="info-footer">
      <Info size={16} className="info-footer__icon" />
      {renderFooterContent()}
      <button 
        onClick={injectDemoData} 
        style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', opacity: 0.8 }}
      >
        Load Demo Data
      </button>
    </div>
  );
}
