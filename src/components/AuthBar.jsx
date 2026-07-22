import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';

export default function AuthBar({ user }) {
  if (!user) {
    return (
      <div className="auth-bar">
        <a href="/.auth/login/github" className="cadence-btn auth-bar__login">
          <LogIn size={14} />
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="auth-bar auth-bar--signed-in">
      <div className="auth-bar__user">
        <User size={14} />
        <span className="auth-bar__name">{user.userDetails}</span>
      </div>
      <a href="/.auth/logout" className="auth-bar__logout">
        <LogOut size={14} />
      </a>
    </div>
  );
}
