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
      <div
        className="notif-banner notif-banner--active"
        style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--sage)',
          borderRadius: 14,
          padding: '14px 16px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'var(--ink)',
        }}
      >
        <BellCheck size={20} color="var(--sage)" />
        <div style={{ flex: 1 }}>
          <strong style={{ color: 'var(--ink)', fontSize: 14, display: 'block' }}>✓ Reminders Active!</strong>
          <p style={{ color: 'var(--slate)', fontSize: 12, margin: 0 }}>Push notifications 5 min before each session.</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)' }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="notif-banner"
      style={{
        background: 'var(--paper-raised)',
        border: '1px solid var(--hairline)',
        borderRadius: 14,
        padding: '16px',
        margin: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        color: 'var(--ink)',
      }}
    >
      <Bell size={24} color="var(--gold)" />
      <div>
        <strong style={{ color: 'var(--ink)', fontSize: 15, display: 'block', marginBottom: 4 }}>Stay on track</strong>
        <p style={{ color: 'var(--slate)', fontSize: 13, margin: 0 }}>Get reminded 5 min before each session starts.</p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          style={{
            background: 'var(--indigo)',
            color: 'var(--paper)',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Enabling...' : 'Enable Reminders'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--hairline)',
            color: 'var(--slate)',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
