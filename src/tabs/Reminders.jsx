import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { Bell, Plus, Loader2, CheckCircle2, Circle } from 'lucide-react';

export default function Reminders({ profile }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [roles, setRoles] = useState({ team: true, client: false });
  const [sending, setSending] = useState(false);

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchReminders();
    
    const subscription = supabase
      .channel('public:reminders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, payload => {
        fetchReminders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile]);

  const fetchReminders = async () => {
    setLoading(true);
    // RLS policy already filters for assigned roles
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });
      
    if (error) setError(error.message);
    else setReminders(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isTeam) return;
    
    const selectedRoles = [];
    if (roles.team) selectedRoles.push('team');
    if (roles.client) selectedRoles.push('client');
    if (selectedRoles.length === 0) return;

    setSending(true);
    
    const { error } = await supabase.from('reminders').insert([{
      text: newText,
      due_date: newDueDate,
      for_roles: selectedRoles,
      created_by: profile.id
    }]);

    if (!error) {
      setNewText(''); setNewDueDate('');
      setShowForm(false);
    } else setError(error.message);
    setSending(false);
  };

  const toggleDone = async (id, currentDone) => {
    if (!isTeam) return;
    await supabase.from('reminders').update({ done: !currentDone }).eq('id', id);
  };

  const getDaysDiff = (dateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateStr);
    due.setHours(0,0,0,0);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days) => {
    if (days < 0) return 'var(--color-danger)';
    if (days <= 3) return 'var(--color-danger)';
    if (days <= 7) return '#f59e0b';
    return 'var(--color-team)';
  };

  const getUrgencyText = (days) => {
    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `In ${days} days`;
  };

  if (loading && reminders.length === 0) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Reminders</h1>
          <p className="text-muted mt-2">Tasks and deadlines.</p>
        </div>
        {isTeam && (
          <button className="btn btn-team" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'New Reminder'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && isTeam && (
        <Card style={{ backgroundColor: '#fafafa', border: '1px solid var(--color-team)' }}>
          <h2 className="text-lg mb-4">Create Reminder</h2>
          <form onSubmit={handleCreate} className="flex-col gap-4">
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Reminder Text</label>
              <input required type="text" className="input-field" value={newText} onChange={e => setNewText(e.target.value)} placeholder="e.g., Provide feedback on homepage designs" />
            </div>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Due Date</label>
              <input required type="date" className="input-field" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Assign To</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                  <input type="checkbox" checked={roles.team} onChange={e => setRoles({...roles, team: e.target.checked})} />
                  Team
                </label>
                <label className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                  <input type="checkbox" checked={roles.client} onChange={e => setRoles({...roles, client: e.target.checked})} />
                  Client
                </label>
              </div>
            </div>
            <button type="submit" disabled={sending || (!roles.team && !roles.client)} className="btn btn-team mt-2" style={{ alignSelf: 'flex-start' }}>
              {sending ? <Loader2 size={16} className="spin" /> : 'Add Reminder'}
            </button>
          </form>
        </Card>
      )}

      {reminders.length === 0 ? (
        <EmptyState icon={Bell} message="No reminders set." />
      ) : (
        <div className="grid-2">
          {reminders.map(rem => {
            const days = getDaysDiff(rem.due_date);
            const color = getUrgencyColor(days);
            return (
              <Card key={rem.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', opacity: rem.done ? 0.6 : 1 }}>
                {isTeam ? (
                  <button onClick={() => toggleDone(rem.id, rem.done)} style={{ color: rem.done ? 'var(--color-success)' : 'var(--color-border)', marginTop: '2px' }}>
                    {rem.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                ) : (
                  <div style={{ color: rem.done ? 'var(--color-success)' : 'var(--color-border)', marginTop: '2px' }}>
                    {rem.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                )}
                <div className="flex-col w-full">
                  <p style={{ fontSize: '15px', fontWeight: 500, textDecoration: rem.done ? 'line-through' : 'none', color: rem.done ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                    {rem.text}
                  </p>
                  {!rem.done && (
                    <div className="mt-2 flex items-center gap-2">
                      <span style={{ fontSize: '12px', fontWeight: 600, color, backgroundColor: `${color}1A`, padding: '2px 8px', borderRadius: '12px' }}>
                        {getUrgencyText(days)}
                      </span>
                      {isTeam && (
                        <span className="text-muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
                          For: {rem.for_roles.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
