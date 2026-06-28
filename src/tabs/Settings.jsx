import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Loader2, Save } from 'lucide-react';

export default function Settings({ profile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('role');
    if (error) setError(error.message);
    else setProfiles(data);
    setLoading(false);
  };

  const handleUpdate = async (id, field, value) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveProfile = async (prof) => {
    setSavingId(prof.id);
    const { error } = await supabase
      .from('profiles')
      .update({ username: prof.username, password: prof.password })
      .eq('id', prof.id);
      
    if (error) setError(error.message);
    else {
      setError('');
      // Optional: show a success toast here
    }
    setSavingId(null);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col gap-6">
      <div>
        <h1 className="text-2xl">Settings & Credentials</h1>
        <p className="text-muted mt-2">View and update login credentials for the portal.</p>
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
          Warning: Plain-text credentials are in use. Changes made here will immediately affect login access.
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="grid-2">
        {profiles.map(p => (
          <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 style={{ fontWeight: 600, fontSize: '16px' }}>{p.name}</h3>
              <Badge type={p.role}>{p.role}</Badge>
            </div>
            
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Username</label>
              <input 
                type="text" 
                className="input-field" 
                value={p.username} 
                onChange={(e) => handleUpdate(p.id, 'username', e.target.value)}
              />
            </div>
            
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
              <input 
                type="text" 
                className="input-field" 
                value={p.password} 
                onChange={(e) => handleUpdate(p.id, 'password', e.target.value)}
              />
            </div>

            <button 
              className={`btn mt-2 ${p.role === 'team' ? 'btn-team' : 'btn-client'}`} 
              onClick={() => saveProfile(p)}
              disabled={savingId === p.id}
            >
              {savingId === p.id ? <Loader2 size={16} className="spin" /> : <><Save size={16} /> Save Changes</>}
            </button>
          </Card>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
