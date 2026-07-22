import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const DISMISS_KEY = 'cadence_notif_dismissed';
const DISMISS_DAYS = 7;

export default function NotificationBanner({ isSupported, isSubscribed, onSubscribe }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if not supported, already subscribed, or recently dismissed
    if (!isSupported || isSubscribed) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // Show after a short delay so it doesn't compete with initial load
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed]);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setVisible(false);
  };

  const handleEnable = async () => {
    const success = await onSubscribe();
    if (success) {
      setVisible(false);
    }
  };

  return (
    <div className="notif-banner">
      <Bell size={18} className="notif-banner__icon" />
      <div className="notif-banner__content">
        <strong>Stay on track</strong>
        <span>Get reminded 5 min before each session.</span>
      </div>
      <div className="notif-banner__actions">
        <button className="cadence-btn notif-banner__enable" onClick={handleEnable}>
          Enable
        </button>
        <button className="cadence-btn notif-banner__dismiss" onClick={handleDismiss}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
