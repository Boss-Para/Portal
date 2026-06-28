import React from 'react';
import { LogOut } from 'lucide-react';
import Avatar from './Avatar';

export default function TopBar({ profile, onSignOut }) {
  return (
    <header className="top-bar">
      <div style={{ fontWeight: 600, fontSize: '16px' }}>
        {profile?.role === 'team' ? 'StarShape Technologies' : 'Client Portal'}
      </div>
      
      <div className="top-bar-right">
        {profile && (
          <div className="user-info">
            <Avatar name={profile.name} role={profile.role} size={36} />
            <div className="user-details">
              <span className="user-name">{profile.name}</span>
              <span className="user-role">{profile.role}</span>
            </div>
          </div>
        )}
        <button 
          onClick={onSignOut}
          className="btn btn-outline"
          style={{ padding: '6px 12px', borderRadius: '6px' }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
