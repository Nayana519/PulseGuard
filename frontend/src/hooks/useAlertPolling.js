import { useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

export function useAlertPolling(onNewAlerts) {
  const lastCountRef = useRef(0);

  const requestNotifPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const showBrowserNotif = useCallback((title, body, severity) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const icons = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
      new Notification(`${icons[severity] || '🔔'} PulseGuard: ${title}`, {
        body,
        requireInteraction: severity === 'critical'
      });
    }
  }, []);

  useEffect(() => {
    requestNotifPermission();
    const poll = async () => {
      try {
        const r = await api.get('/alerts/?unread=true');
        const alerts = r.data;
        if (alerts.length > lastCountRef.current) {
          const newAlerts = alerts.slice(0, alerts.length - lastCountRef.current);
          newAlerts.forEach(a => showBrowserNotif(a.title, a.message, a.severity));
          onNewAlerts?.(alerts);
        }
        lastCountRef.current = alerts.length;
      } catch (_) {}
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [onNewAlerts, showBrowserNotif, requestNotifPermission]);
}