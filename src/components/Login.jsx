import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import bcrypt from 'bcryptjs';

export default function Login({ onSession }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Fetch user by username only
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (queryError || !data) {
      setError('Invalid username or password.');
      setLoading(false);
      return;
    }

    // Verify password securely
    const isPasswordValid = bcrypt.compareSync(password, data.password);

    if (!isPasswordValid) {
      setError('Invalid username or password.');
      setLoading(false);
      return;
    }

    // Store custom session in local storage
    const sessionData = { user: data };
    localStorage.setItem('custom_session', JSON.stringify(sessionData));
    onSession(sessionData);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleLogin} className="auth-form" style={{ marginTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 className="text-2xl">Welcome Back</h2>
            <p className="text-muted" style={{ marginTop: '8px' }}>
              Sign in to access your portal
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="flex-col gap-2 mb-4">
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

          <div className="flex-col gap-2 mb-6">
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
            className="btn btn-team"
            disabled={loading}
            style={{ padding: '12px', fontSize: '15px', width: '100%' }}
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
