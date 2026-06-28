import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Loader2, Save, UserPlus } from 'lucide-react';

export default function Settings({ profile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  // New user state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'client' });
  const [creatingUser, setCreatingUser] = useState(false);

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    // Only fetch the current user's profile to prevent seeing others' passwords
    const { data, error } = await supabase.from('profiles').select('*').eq('id', profile.id);
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
    }
    setSavingId(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isTeam) return;
    setCreatingUser(true);
    
    const { error: createError } = await supabase.from('profiles').insert([{
      username: newUser.username,
      password: newUser.password,
      name: newUser.name,
      role: newUser.role
    }]);

    if (createError) {
      setError(createError.message);
    } else {
      setNewUser({ username: '', password: '', name: '', role: 'client' });
      setShowAddUser(false);
      setError('');
      alert('User created successfully!');
    }
    setCreatingUser(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl">Settings & Credentials</h1>
          <p className="text-muted mt-2">Manage your login credentials.</p>
        </div>
        {isTeam && (
          <button className="btn btn-team" onClick={() => setShowAddUser(!showAddUser)}>
            <UserPlus size={16} /> {showAddUser ? 'Cancel' : 'Add New User'}
          </button>
        )}
      </div>
      
      <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
        Warning: Plain-text credentials are in use. Changes made here will immediately affect login access.
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddUser && isTeam && (
        <Card style={{ backgroundColor: '#fafafa', border: '1px solid var(--color-team)' }}>
          <h2 className="text-lg mb-4">Create New Account</h2>
          <form onSubmit={handleCreateUser} className="flex-col gap-4">
            <div className="grid-2">
              <div className="flex-col gap-2">
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Full Name</label>
                <input required type="text" className="input-field" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="flex-col gap-2">
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Role</label>
                <select className="input-field" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="client">Client</option>
                  <option value="team">Team Member</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="flex-col gap-2">
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Username</label>
                <input required type="text" className="input-field" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <div className="flex-col gap-2">
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
                <input required type="text" className="input-field" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
            </div>
            <button type="submit" disabled={creatingUser} className="btn btn-team mt-2" style={{ alignSelf: 'flex-start' }}>
              {creatingUser ? <Loader2 size={16} className="spin" /> : 'Create Account'}
            </button>
          </form>
        </Card>
      )}

      <div className="grid-2">
        {profiles.map(p => (
          <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 style={{ fontWeight: 600, fontSize: '16px' }}>{p.name}</h3>
              <Badge type={p.role}>{p.role}</Badge>
            </div>
            
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Your Username</label>
              <input 
                type="text" 
                className="input-field" 
                value={p.username} 
                onChange={(e) => handleUpdate(p.id, 'username', e.target.value)}
              />
            </div>
            
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Your Password</label>
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
