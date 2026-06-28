import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Loader2, Save, UserPlus } from 'lucide-react';
import bcrypt from 'bcryptjs';

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
    else {
      // Clear out the password field so we don't display the raw hash to the user
      const cleanProfiles = data.map(p => ({ ...p, newPassword: '' }));
      setProfiles(cleanProfiles);
    }
    setLoading(false);
  };

  const handleUpdate = async (id, field, value) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveProfile = async (prof) => {
    setSavingId(prof.id);
    
    const updates = { username: prof.username };
    
    // Only update password if they typed a new one
    if (prof.newPassword && prof.newPassword.trim().length > 0) {
      updates.password = bcrypt.hashSync(prof.newPassword.trim(), 10);
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', prof.id);
      
    if (error) setError(error.message);
    else {
      setError('');
      // Clear the new password field after saving
      handleUpdate(prof.id, 'newPassword', '');
      alert('Settings saved successfully!');
    }
    setSavingId(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isTeam) return;
    setCreatingUser(true);
    
    // Hash password before inserting
    const hashedPassword = bcrypt.hashSync(newUser.password.trim(), 10);
    
    const { error: createError } = await supabase.from('profiles').insert([{
      username: newUser.username.trim(),
      password: hashedPassword,
      name: newUser.name.trim(),
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
          <p className="text-muted mt-2">Manage your login credentials securely.</p>
        </div>
        {isTeam && (
          <button className="btn btn-team" onClick={() => setShowAddUser(!showAddUser)}>
            <UserPlus size={16} /> {showAddUser ? 'Cancel' : 'Add New User'}
          </button>
        )}
      </div>
      
      <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
        Security Update: All passwords are now securely hashed.
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
                <input required type="password" className="input-field" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
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
              <label style={{ fontSize: '14px', fontWeight: 500 }}>New Password (leave blank to keep current)</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Enter new password"
                value={p.newPassword} 
                onChange={(e) => handleUpdate(p.id, 'newPassword', e.target.value)}
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
