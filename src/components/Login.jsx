import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Login({ onSession }) {
  const [activeTab, setActiveTab] = useState('client');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Fetch user with matching username and password from the profiles table
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('role', activeTab) // ensure they are logging into the correct tab
      .maybeSingle();

    if (queryError || !data) {
      setError('Invalid username, password, or role tab.');
      setLoading(false);
    } else {
      // Store custom session in local storage
      const sessionData = { user: data };
      localStorage.setItem('custom_session', JSON.stringify(sessionData));
      onSession(sessionData);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${activeTab === 'client' ? 'active-client' : ''}`}
            onClick={() => { setActiveTab('client'); setError(''); }}
          >
            Client Login
          </button>
          <button 
            className={`auth-tab ${activeTab === 'team' ? 'active-team' : ''}`}
            onClick={() => { setActiveTab('team'); setError(''); }}
          >
            Team Login
          </button>
        </div>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 className="text-xl">Welcome Back</h2>
            <p className="text-muted" style={{ marginTop: '4px' }}>
              {activeTab === 'client' ? 'Sign in to view your project portal' : 'Sign in to access the agency dashboard'}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="flex-col gap-2">
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. team_admin" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`btn mt-4 ${activeTab === 'team' ? 'btn-team' : 'btn-client'}`}
            disabled={loading}
            style={{ padding: '12px', fontSize: '15px' }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
