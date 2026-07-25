import React, { useState, useEffect } from 'react';
import { Bell, BellCheck, X } from 'lucide-react';

export default function NotificationBanner({
  isSupported,
  isSubscribed,
  onSubscribe,
}) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribedLocal, setSubscribedLocal] = useState(isSubscribed);

  useEffect(() => {
    if (subscribedLocal && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [subscribedLocal, dismissed]);

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
          borderRadius: 30,
          padding: '8px 14px',
          margin: '16px auto',
          maxWidth: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: 'var(--sage)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          animation: 'stampIn 0.3s ease-out'
        }}
      >
        <BellCheck size={16} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Reminders Active!</span>
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
        padding: '12px 16px',
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        color: 'var(--ink)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bell size={18} color="var(--gold)" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ color: 'var(--ink)', fontSize: 13, display: 'block' }}>Stay on track</strong>
          <span style={{ color: 'var(--slate)', fontSize: 11 }}>Get notified 5m before sessions.</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            color: 'var(--slate)',
            border: 'none',
            padding: '4px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          style={{
            background: 'var(--indigo)',
            color: 'var(--paper)',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? '...' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
