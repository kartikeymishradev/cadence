const webpush = require('web-push');
const { getContainer } = require('../lib/cosmos');

// Track already-notified tasks to avoid duplicate sends (TTL = 1 day)
const notifiedSet = new Map();
const NOTIFIED_TTL = 24 * 60 * 60 * 1000;

function cleanExpiredNotifications() {
  const now = Date.now();
  for (const [key, timestamp] of notifiedSet) {
    if (now - timestamp > NOTIFIED_TTL) {
      notifiedSet.delete(key);
    }
  }
}

/**
 * Get the current day name (Monday..Sunday) and current HH:MM.
 */
function getCurrentDayAndTime() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[now.getDay()];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return { day, time: `${hours}:${minutes}` };
}

/**
 * Check if a task starts within the next `leadMinutes` from now.
 */
function isUpcoming(taskStart, leadMinutes = 5) {
  if (!taskStart || taskStart === '--:--') return false;

  const now = new Date();
  const [h, m] = taskStart.split(':').map(Number);
  const taskTime = new Date(now);
  taskTime.setHours(h, m, 0, 0);

  const diffMs = taskTime - now;
  return diffMs > 0 && diffMs <= leadMinutes * 60 * 1000;
}

module.exports = async function (context) {
  cleanExpiredNotifications();

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublic || !vapidPrivate) {
    context.log.warn('VAPID keys not configured — skipping push cron');
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  try {
    const schedules = await getContainer('schedules');
    const subscriptions = await getContainer('push_subscriptions');

    const { day } = getCurrentDayAndTime();

    // Get the current week's Monday date
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const weekStart = monday.toISOString().slice(0, 10);

    // Query all schedules for this week
    const { resources: allSchedules } = await schedules.items
      .query({
        query: 'SELECT * FROM c WHERE c.weekStart = @week',
        parameters: [{ name: '@week', value: weekStart }],
      })
      .fetchAll();

    // For each schedule, check if any task is upcoming
    for (const sched of allSchedules) {
      const tasks = sched.tasks || [];
      const upcomingTasks = tasks.filter(
        (t) => t.day === day && isUpcoming(t.start)
      );

      if (upcomingTasks.length === 0) continue;

      // Check if we already notified for these tasks
      const unnotified = upcomingTasks.filter((t) => {
        const key = `${sched.userId}_${t.day}_${t.start}_${t.title}`;
        return !notifiedSet.has(key);
      });

      if (unnotified.length === 0) continue;

      // Look up push subscription for this user
      const subDocId = `${sched.userId}_push`;
      let subDoc;
      try {
        const { resource } = await subscriptions
          .item(subDocId, sched.userId)
          .read();
        subDoc = resource;
      } catch {
        continue; // No push subscription for this user
      }

      if (!subDoc || !subDoc.subscription) continue;

      // Send notification for each upcoming task
      for (const task of unnotified) {
        const notifKey = `${sched.userId}_${task.day}_${task.start}_${task.title}`;

        const payload = JSON.stringify({
          title: 'Dintaal',
          body: `${task.title} in 5 min ⏱`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: notifKey,
        });

        try {
          await webpush.sendNotification(subDoc.subscription, payload);
          notifiedSet.set(notifKey, Date.now());
          context.log(`Notified ${sched.userId}: ${task.title} at ${task.start}`);
        } catch (err) {
          if (err.statusCode === 410) {
            // Subscription expired — remove it
            try {
              await subscriptions.item(subDocId, sched.userId).delete();
            } catch { /* ignore */ }
          }
          context.log.error(`Push failed for ${sched.userId}:`, err.message);
        }
      }
    }
  } catch (err) {
    context.log.error('Push cron error:', err);
  }
};
