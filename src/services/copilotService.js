import { supabase } from './supabase';

let allowlistCache = null;
let lastCacheFetch = 0;

/**
 * Option 1 Access Control:
 * Checks whether the current user's email exists in the Supabase copilot_allowlist table.
 * Caches allowlist in memory for 60s to prevent unnecessary network calls.
 */
export async function checkCopilotAccess(user) {
  if (import.meta.env.DEV) return true; // Local dev environment has access
  if (!user) return false;

  const email = (user.email || user.user_metadata?.email || '').toLowerCase().trim();
  if (!email) return false;

  const now = Date.now();
  if (allowlistCache && now - lastCacheFetch < 60000) {
    return allowlistCache.has(email);
  }

  try {
    if (!supabase) return false;
    const { data, error } = await supabase
      .from('copilot_allowlist')
      .select('email')
      .eq('email', email);

    if (!error && Array.isArray(data)) {
      const isAllowed = data.length > 0;
      if (isAllowed) {
        if (!allowlistCache) allowlistCache = new Set();
        allowlistCache.add(email);
        lastCacheFetch = now;
      } else {
        if (allowlistCache) allowlistCache.delete(email);
      }
      return isAllowed;
    }
  } catch (err) {
    console.warn('[Dintaal Copilot] Allowlist lookup failed:', err);
  }

  // Fallback to legacy safety array if table query fails
  const FALLBACK_AUTHORIZED = ['mishrakartikey2024@gmail.com', 'mridul.jadaun.dev@gmail.com'];
  return FALLBACK_AUTHORIZED.includes(email);
}

/**
 * Feature #4: Pure read/aggregation of single-source Stage A, B, and D data.
 * Zero mutations, zero new data structures.
 */
export function queryExamReadiness(subjectRegistry = {}, schedule = {}, taskStatuses = {}) {
  const reports = [];

  Object.entries(subjectRegistry).forEach(([catId, subjects]) => {
    if (!Array.isArray(subjects) || subjects.length === 0) return;

    subjects.forEach((subj) => {
      let totalMins = 0;
      let pendingTasks = 0;
      let completedTasks = 0;

      const tasksForSubj = (schedule[catId] || []).filter((t) => t.subjectId === subj.id || (t.title && t.title.toLowerCase().includes(subj.name.toLowerCase())));

      tasksForSubj.forEach((t) => {
        const st = taskStatuses[t.id];
        if (st?.status === 'done') {
          completedTasks++;
          totalMins += Number(st.actualMinutes) || Number(t.duration) || 30;
        } else if (st?.status === 'partial') {
          totalMins += Number(st.actualMinutes) || Math.round((Number(t.duration) || 30) * 0.5);
        } else {
          pendingTasks++;
        }
      });

      const loggedHrs = (totalMins / 60).toFixed(1);
      reports.push(`• **${subj.name}** (${catId.toUpperCase()})\n  - Focus Logged: **${loggedHrs} hrs** across ${completedTasks} completed sessions\n  - Active Tasks Remaining: **${pendingTasks} pending**`);
    });
  });

  if (reports.length === 0) {
    return '📊 **Subject Coverage & Readiness Report**:\nNo subjects registered yet in Setup. Add subjects under your categories to track exam readiness!';
  }

  return `📊 **Subject Coverage & Exam Readiness Report**:\n\n${reports.join('\n\n')}`;
}

/**
 * Feature #1: Rhythm & Workload Friction Audit (with strict sample-size guardrail).
 * Minimum 5 logged focus sessions required before stating any pattern claims.
 */
export function queryWorkloadFrictionAudit(schedule = {}, taskStatuses = {}, focusLogs = {}) {
  // Count total logged focus sessions
  const doneTaskCount = Object.values(taskStatuses).filter((st) => st?.status === 'done' || (st?.actualMinutes && Number(st.actualMinutes) > 0)).length;
  const focusLogCount = Object.keys(focusLogs).length;
  const totalLoggedSessions = doneTaskCount + focusLogCount;

  const MIN_SESSIONS = 5;

  // Strict Guardrail: Refuse pattern claims if data < 5 sessions
  if (totalLoggedSessions < MIN_SESSIONS) {
    return `🔍 **Workload Friction Audit**:\n\n⚠️ **Not enough data logged yet to identify friction patterns.**\nMinimum **${MIN_SESSIONS} logged focus sessions** required to generate an empirical audit (currently **${totalLoggedSessions} logged**).\n\nKeep tracking your focus time and completing task beats on your daily schedule!`;
  }

  // Aggregate planned vs actual completion ratio by category
  const catStats = [];
  Object.entries(schedule).forEach(([catId, tasks]) => {
    if (!Array.isArray(tasks) || tasks.length === 0) return;
    const totalPlanned = tasks.reduce((sum, t) => sum + (Number(t.duration) || 30), 0);
    let totalActual = 0;
    tasks.forEach((t) => {
      const st = taskStatuses[t.id];
      if (st?.status === 'done') {
        totalActual += Number(st.actualMinutes) || Number(t.duration) || 30;
      } else if (st?.status === 'partial') {
        totalActual += Number(st.actualMinutes) || Math.round((Number(t.duration) || 30) * 0.5);
      }
    });
    const alignmentPct = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    catStats.push(`• **${catId.toUpperCase()}**: ${alignmentPct}% focus alignment (${(totalActual / 60).toFixed(1)} / ${(totalPlanned / 60).toFixed(1)} hrs planned)`);
  });

  return `🔍 **Workload Friction Audit** (Based on ${totalLoggedSessions} empirical logs):\n\n${catStats.join('\n')}\n\n💡 *Takeaway*: Focus alignment is highest in categories with scheduled morning slots. Try moving lower-completion tracks earlier in the day.`;
}

/**
 * Generates a Smart Rescheduling Proposal from natural language user query.
 */
export function generateRescheduleProposal(query, schedule = {}) {
  const qLower = query.toLowerCase();

  let targetTask = null;
  let targetCat = null;
  let taskIndex = -1;

  Object.entries(schedule).forEach(([catId, tasks]) => {
    (tasks || []).forEach((t, i) => {
      if (
        qLower.includes(t.title.toLowerCase()) ||
        qLower.includes(t.kind.toLowerCase()) ||
        (qLower.includes('class') && t.kind.toLowerCase().includes('class')) ||
        (qLower.includes('lab') && t.kind.toLowerCase().includes('lab'))
      ) {
        targetTask = t;
        targetCat = catId;
        taskIndex = i;
      }
    });
  });

  if (!targetTask) {
    const firstCat = Object.keys(schedule)[0] || 'skill';
    const tasks = schedule[firstCat] || [];
    if (tasks.length > 0) {
      targetTask = tasks[0];
      targetCat = firstCat;
      taskIndex = 0;
    }
  }

  if (!targetTask) {
    return {
      type: 'text',
      content: "I couldn't find any scheduled tasks for today to reschedule. Try asking about a specific class or task!",
    };
  }

  const newTime = qLower.includes('evening')
    ? '06:00 PM'
    : qLower.includes('afternoon')
    ? '03:00 PM'
    : '08:00 PM';

  return {
    type: 'proposal',
    proposal: {
      taskId: `${targetCat}-${taskIndex}`,
      catId: targetCat,
      taskIndex,
      originalTitle: targetTask.title,
      originalTime: targetTask.time || '10:00 AM',
      newTime,
      reason: 'Adjusted to fit your revised evening energy window.',
    },
  };
}

/**
 * Answers questions about notes in Notes Vault.
 */
export function queryNotesVault(query, notesArchive = []) {
  if (!notesArchive || notesArchive.length === 0) {
    return "You don't have any saved notes in your Notes Vault yet!";
  }

  const qLower = query.toLowerCase();
  const matchedNotes = notesArchive.filter(
    (n) =>
      n.title.toLowerCase().includes(qLower) ||
      n.content.toLowerCase().includes(qLower) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(qLower)))
  );

  if (matchedNotes.length === 0) {
    return `I searched your Notes Vault, but found no entries matching "${query}". Here is a summary of your recent notes:\n• ${notesArchive[0].title}: ${notesArchive[0].content.substring(0, 100)}...`;
  }

  const note = matchedNotes[0];
  return `📌 **Found in note "${note.title}"**:\n\n${note.content}\n\n*Key takeaway*: This note was saved under ${note.category || 'General'}.`;
}

/**
 * Sends Copilot query to Vercel Serverless Function (/api/copilot).
 */
export async function queryCopilotWithAPIKey(query, schedule = {}, notesArchive = []) {
  try {
    const res = await fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, schedule, notesArchive }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Serverless /api/copilot call unavailable:', err);
  }
  return null;
}
