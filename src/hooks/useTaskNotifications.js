import { useEffect, useRef, useState, useCallback } from 'react';
import { WEEKDAYS } from '../utils/constants';

/**
 * Hook that schedules client-side native browser notifications for tasks starting today.
 */
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
        // Send instant test notification as requested by user
        new Notification('🔔 Dintaal Task Reminders Enabled!', {
          body: 'You are all set! Dintaal will alert you when your scheduled tasks begin.',
          icon: '/favicon.ico',
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

    const interval = setInterval(() => {
      const now = new Date();
      const todayIdx = now.getDay();
      const todayName = WEEKDAYS[(todayIdx + 6) % 7] || 'Monday';

      const currentMins = now.getHours() * 60 + now.getMinutes();

      (categories || []).forEach((cat) => {
        const tasks = schedule[cat.id] || [];
        tasks.forEach((task, idx) => {
          if (!task.time || task.day !== todayName) return;

          const taskId = `${cat.id}-${idx}-${now.toDateString()}`;
          if (notifiedTasks.current.has(taskId)) return;

          // Parse task time e.g., "10:00 AM" or "14:30"
          const timeParts = task.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (!timeParts) return;

          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const ampm = timeParts[3];

          if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
          }

          const taskStartMins = hours * 60 + minutes;

          // Notify if task starts within 1 minute
          if (Math.abs(currentMins - taskStartMins) <= 1) {
            notifiedTasks.current.add(taskId);
            new Notification(`⏰ Task Starting: ${task.title}`, {
              body: `${task.time} (${cat.label || 'Schedule'}) — ${task.kind || 'Time to focus!'}`,
              icon: '/favicon.ico',
            });
          }
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [permission, schedule, categories]);

  return { permission, requestNotificationPermission };
}
