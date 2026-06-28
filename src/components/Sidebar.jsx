import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Ticket, 
  Calendar, 
  KeyRound, 
  Bell,
  Settings
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, role }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'access', label: 'Access Requests', icon: KeyRound },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeClass = role === 'team' ? 'active-team' : 'active-client';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        CarittoPro Portal
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? activeClass : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
