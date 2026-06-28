import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Login from './components/Login';

import Overview from './tabs/Overview';
import Comments from './tabs/Comments';
import Tickets from './tabs/Tickets';
import Meetings from './tabs/Meetings';
import AccessRequests from './tabs/AccessRequests';
import Reminders from './tabs/Reminders';
import Settings from './tabs/Settings';
import Todos from './tabs/Todos';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check local storage for custom session
    const storedSession = localStorage.getItem('custom_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
        setProfile(parsed.user);
      } catch (e) {
        localStorage.removeItem('custom_session');
      }
    }
    setLoading(false);
  }, []);

  const handleSetSession = (newSession) => {
    setSession(newSession);
    setProfile(newSession?.user || null);
  };

  const handleSignOut = () => {
    localStorage.removeItem('custom_session');
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-team)' }} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (!session || !profile) {
    return <Login onSession={handleSetSession} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <Overview profile={profile} />;
      case 'comments': return <Comments profile={profile} />;
      case 'tickets': return <Tickets profile={profile} />;
      case 'meetings': return <Meetings profile={profile} />;
      case 'access': return <AccessRequests profile={profile} />;
      case 'reminders': return <Reminders profile={profile} />;
      case 'todos': return <Todos profile={profile} />;
      case 'settings': return <Settings profile={profile} />;
      default: return <Overview profile={profile} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={profile.role} />
      <div className="main-content-wrapper">
        <TopBar profile={profile} onSignOut={handleSignOut} />
        <main className="main-content">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
