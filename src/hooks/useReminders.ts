import { useEffect, useRef } from 'react';
import { Plan } from '../types';
import { isSameDay, parse, isAfter } from 'date-fns';

export function useReminders(plans: Plan[], onNotify: (plan: Plan) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const interval = setInterval(() => {
      const now = new Date();
      const nowTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const todayStr = now.toISOString().split('T')[0];

      plans.forEach(plan => {
        if (!plan.reminder?.enabled || plan.isCompleted) return;

        const shouldNotify = () => {
          if (plan.reminder?.repeat === 'once') {
            return plan.date === todayStr && plan.reminder.time === nowTimeStr;
          }
          if (plan.reminder?.repeat === 'daily') {
            return plan.reminder.time === nowTimeStr;
          }
          if (plan.reminder?.repeat === 'weekdays') {
            const day = now.getDay();
            return day >= 1 && day <= 5 && plan.reminder.time === nowTimeStr;
          }
          // Simple check: only notify once per minute
          return false;
        };

        if (shouldNotify()) {
          const lastNotified = plan.reminder.lastNotified || 0;
          const oneMinuteAgo = Date.now() - 60000;
          
          if (lastNotified < oneMinuteAgo) {
            audioRef.current?.play().catch(() => {});
            onNotify(plan);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [plans, onNotify]);

  return {
    requestPermission: () => Notification.requestPermission()
  };
}
