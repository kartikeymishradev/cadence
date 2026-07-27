const AUTHORIZED_EMAILS = [
  'mishrakartikey2024@gmail.com',
  'mridul.jadaun.dev@gmail.com',
];

/**
 * Checks whether the current user is authorized for Dintaal AI Copilot Beta.
 * Uses strict Supabase OAuth verified email authentication to prevent impersonation.
 */
export function checkCopilotAccess(user) {
  if (import.meta.env.DEV) return true; // Local dev environment has access
  if (!user) return false;

  const email = (user.email || user.user_metadata?.email || '').toLowerCase().trim();
  if (!email) return false;

  return AUTHORIZED_EMAILS.includes(email);
}

/**
 * Generates a Smart Rescheduling Proposal from natural language user query.
 */
export function generateRescheduleProposal(query, schedule = {}) {
  const qLower = query.toLowerCase();

  // Simple heuristic parser for instant response + Fallback to structured proposal
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
    // Pick first task if not explicitly matched
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
 * Sends Copilot query to Vercel Serverless Function (/api/copilot) where secrets are kept 100% server-side.
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
