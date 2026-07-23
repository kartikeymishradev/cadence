import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { signInWithGoogle, signOut } from '../services/cloudSync';

export default function AuthBar({ user }) {
  if (!user) {
    return (
      <div className="auth-bar">
        <button
          id="auth-signin-btn"
          className="cadence-btn auth-bar__login"
          onClick={signInWithGoogle}
        >
          <LogIn size={14} />
          Sign in with Google
        </button>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.email || 'User';
  const avatar = user.user_metadata?.avatar_url;

  return (
    <div className="auth-bar auth-bar--signed-in">
      <div className="auth-bar__user">
        {avatar
          ? <img src={avatar} alt={name} className="auth-bar__avatar" />
          : <User size={14} />
        }
        <span className="auth-bar__name">{name}</span>
      </div>
      <button
        id="auth-signout-btn"
        className="auth-bar__logout"
        onClick={signOut}
        title="Sign out"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
