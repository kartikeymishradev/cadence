import React, { useState } from 'react';
import { Bell, BellCheck, X } from 'lucide-react';

export default function NotificationBanner({
  isSupported,
  isSubscribed,
  onSubscribe,
}) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribedLocal, setSubscribedLocal] = useState(isSubscribed);

  if (!isSupported || dismissed) return null;

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      if (onSubscribe) {
        await onSubscribe();
      }
      setSubscribedLocal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (subscribedLocal) {
    return (
      <div className="notif-banner notif-banner--active">
        <BellCheck size={18} className="notif-banner__icon" />
        <div className="notif-banner__content">
          <strong>✓ Reminders Active!</strong>
          <p>You will get push notifications 5 min before each session.</p>
        </div>
        <button
          className="notif-banner__dismiss"
          onClick={() => setDismissed(true)}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="notif-banner">
      <Bell size={18} className="notif-banner__icon" />
      <div className="notif-banner__content">
        <strong>Stay on track</strong>
        <p>Get reminded 5 min before each session starts.</p>
      </div>
      <div className="notif-banner__actions">
        <button
          className="cadence-btn cadence-btn--primary notif-enable-btn"
          onClick={handleEnableNotifications}
          disabled={loading}
        >
          {loading ? 'Enabling...' : 'Enable Reminders'}
        </button>
        <button
          className="notif-banner__dismiss"
          onClick={() => setDismissed(true)}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
