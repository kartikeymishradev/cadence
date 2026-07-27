import React from 'react';
import { LogIn, LogOut, User, Trash2 } from 'lucide-react';
import { signInWithGoogle, signOut, cloudDeleteAll } from '../services/cloudSync';

export default function AuthBar({ user }) {
  const handleClearData = async () => {
    const confirmation = window.prompt('Are you sure you want to completely delete ALL your Dintaal data (schedule, tasks, etc)? This cannot be undone.\\n\\nType "delete" (without quotes) to confirm:');
    if (confirmation === 'delete') {
      try {
        await cloudDeleteAll();
      } catch (err) {
        console.error("Failed to delete cloud data:", err);
      }
      window.localStorage.clear();
      window.location.reload();
    } else if (confirmation !== null) {
      alert('Deletion cancelled. You must type exactly "delete".');
    }
  };

  const ClearDataBtn = () => (
    <button
      onClick={handleClearData}
      title="Clear all app data"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: '1px solid var(--cherry)',
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 12,
        color: 'var(--cherry)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--cherry)'; e.currentTarget.style.color = 'white'; }}
      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cherry)'; }}
    >
      <Trash2 size={12} />
      Clear Data
    </button>
  );

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, gap: 12, alignItems: 'center' }}>
        <ClearDataBtn />
        <button
          id="auth-signin-btn"
          onClick={signInWithGoogle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--paper-raised)',
            border: '1px solid var(--hairline)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            color: 'var(--slate)',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <LogIn size={14} />
          Sign in
        </button>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.email || 'User';
  const initial = name.charAt(0).toUpperCase();
  const avatar = user.user_metadata?.avatar_url;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, gap: 12, alignItems: 'center' }}>
      <ClearDataBtn />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--paper-raised)',
        border: '1px solid var(--hairline)',
        padding: '4px 6px 4px 12px',
        borderRadius: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--slate)', fontWeight: 500 }}>
            {name}
          </span>
          {avatar ? (
            <img 
              src={avatar} 
              alt={name} 
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--paper)', boxShadow: '0 0 0 1px var(--indigo)' }}
            />
          ) : (
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--indigo)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--paper)',
              fontFamily: 'var(--font-voice)',
              fontSize: 14,
              fontWeight: '600',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              {initial}
            </div>
          )}
        </div>
        
        <div style={{ width: 1, height: 16, background: 'var(--hairline)', margin: '0 4px' }} />

        <button
          id="auth-signout-btn"
          onClick={signOut}
          title="Sign out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--slate)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            borderRadius: '50%',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--rose)'; e.currentTarget.style.background = 'var(--paper)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--slate)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
