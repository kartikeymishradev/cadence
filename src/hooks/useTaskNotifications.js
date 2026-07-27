import { useEffect, useRef, useState, useCallback } from 'react';
import { WEEKDAYS } from '../utils/constants';

/**
 * Robust helper to match day names like "Mon", "Monday", "mon"
 */
function isDayMatch(taskDay, todayName) {
  if (!taskDay) return true; // Tasks without explicit day apply every day
  const tDayLower = String(taskDay).toLowerCase().trim();
  const todayLower = String(todayName).toLowerCase().trim();
  const todayShort = todayLower.slice(0, 3);
  return tDayLower === todayLower || tDayLower.startsWith(todayShort);
}

/**
 * Parses time strings like "10:00 AM", "19:30", "9:00", "09:00 AM" into minutes from midnight
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    const ampmUpper = ampm.toUpperCase();
    if (ampmUpper === 'PM' && hours < 12) hours += 12;
    if (ampmUpper === 'AM' && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Sends a notification using ServiceWorker registration if available, or falls back to window.Notification
 */
export async function sendBrowserNotification(title, options = {}) {
  const defaultOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return;
      }
    }
  } catch (e) {
    console.warn('SW notification fallback to window.Notification:', e);
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, defaultOptions);
  }
}

export function useTaskNotifications(schedule = {}, categories = []) {
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const notifiedTasks = useRef(new Set());

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';

    try {
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === 'granted') {
        sendBrowserNotification('🔔 Dintaal Reminders Active!', {
          body: 'You are all set! Dintaal will alert you 5m before and at session start time.',
        });
      }
      return res;
    } catch (err) {
      console.error('Notification permission error:', err);
      return 'denied';
    }
  }, []);

  // Interval check every 30 seconds
  useEffect(() => {
    if (permission !== 'granted') return;

    const checkAndNotify = () => {
      const now = new Date();
      const todayIdx = now.getDay();
      const todayName = WEEKDAYS[(todayIdx + 6) % 7] || 'Monday';
      const currentMins = now.getHours() * 60 + now.getMinutes();

      (categories || []).forEach((cat) => {
        const tasks = schedule[cat.id] || [];
        tasks.forEach((task, idx) => {
          const taskTime = task.start || task.time;
          if (!taskTime || !isDayMatch(task.day, todayName)) return;

          const taskStartMins = parseTimeToMinutes(taskTime);
          if (taskStartMins === null) return;

          const timeDiff = taskStartMins - currentMins;
          const dateStr = now.toDateString();

          // 1. Alert 5 minutes BEFORE task start
          if (timeDiff === 5) {
            const taskId5m = `${cat.id}-${idx}-5m-${dateStr}`;
            if (!notifiedTasks.current.has(taskId5m)) {
              notifiedTasks.current.add(taskId5m);
              sendBrowserNotification(`⏰ Task in 5 min: ${task.title}`, {
                body: `Starts at ${taskTime} (${cat.label || 'Schedule'}) — Get ready!`,
              });
            }
          }

          // 2. Alert AT task start (within 0-1 minute)
          if (Math.abs(timeDiff) <= 1) {
            const taskIdStart = `${cat.id}-${idx}-start-${dateStr}`;
            if (!notifiedTasks.current.has(taskIdStart)) {
              notifiedTasks.current.add(taskIdStart);
              sendBrowserNotification(`🔔 Starting Now: ${task.title}`, {
                body: `${taskTime} (${cat.label || 'Schedule'}) — Time to focus!`,
              });
            }
          }
        });
      });
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 30000);

    return () => clearInterval(interval);
  }, [permission, schedule, categories]);

  return { permission, requestNotificationPermission };
}
