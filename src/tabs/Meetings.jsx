import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { Calendar, Plus, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Meetings({ profile }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [sending, setSending] = useState(false);

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchMeetings();
    
    const subscription = supabase
      .channel('public:meetings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, payload => {
        fetchMeetings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
      
    if (error) setError(error.message);
    else setMeetings(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isTeam) return;
    setSending(true);
    
    const { error } = await supabase.from('meetings').insert([{
      title: newTitle,
      date: newDate,
      time: newTime,
      link: newLink,
      notes: newNotes,
      created_by: profile.id
    }]);

    if (!error) {
      setNewTitle(''); setNewDate(''); setNewTime(''); setNewLink(''); setNewNotes('');
      setShowForm(false);
    } else setError(error.message);
    setSending(false);
  };

  const handleConfirm = async (id) => {
    if (isTeam) return; // Only clients confirm
    await supabase.from('meetings').update({ confirmed: true }).eq('id', id);
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  const upcomingMeetings = meetings.filter(m => new Date(`${m.date}T${m.time}`) >= today);
  const pastMeetings = meetings.filter(m => new Date(`${m.date}T${m.time}`) < today);

  if (loading && meetings.length === 0) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Meetings</h1>
          <p className="text-muted mt-2">Schedule and join syncs.</p>
        </div>
        {isTeam && (
          <button className="btn btn-team" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'Schedule Meeting'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && isTeam && (
        <Card style={{ backgroundColor: '#fafafa', border: '1px solid var(--color-team)' }}>
          <h2 className="text-lg mb-4">Schedule a Meeting</h2>
          <form onSubmit={handleCreate} className="flex-col gap-4">
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Meeting Title</label>
              <input required type="text" className="input-field" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="flex-col gap-2">
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Date</label>
                <input required type="date" className="input-field" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div className="flex-col gap-2">
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Time</label>
                <input required type="time" className="input-field" value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
            </div>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Meeting Link</label>
              <input type="url" className="input-field" value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Notes / Agenda (Optional)</label>
              <textarea className="input-field" rows={3} value={newNotes} onChange={e => setNewNotes(e.target.value)}></textarea>
            </div>
            <button type="submit" disabled={sending} className="btn btn-team mt-2" style={{ alignSelf: 'flex-start' }}>
              {sending ? <Loader2 size={16} className="spin" /> : 'Create Meeting'}
            </button>
          </form>
        </Card>
      )}

      {meetings.length === 0 ? (
        <EmptyState icon={Calendar} message="No meetings scheduled yet." />
      ) : (
        <div className="flex-col gap-6">
          <div className="flex-col gap-4">
            <h2 className="text-lg">Upcoming</h2>
            {upcomingMeetings.length === 0 && <p className="text-muted">No upcoming meetings.</p>}
            {upcomingMeetings.map(m => (
              <Card key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex items-start gap-4">
                  <div style={{ backgroundColor: 'rgba(108, 71, 255, 0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', minWidth: '64px' }}>
                    <div style={{ color: 'var(--color-team)', fontWeight: 700, fontSize: '14px' }}>{format(new Date(`${m.date}T00:00:00`), 'MMM')}</div>
                    <div style={{ color: 'var(--color-text-main)', fontWeight: 800, fontSize: '20px' }}>{format(new Date(`${m.date}T00:00:00`), 'dd')}</div>
                  </div>
                  <div className="flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3 style={{ fontWeight: 600, fontSize: '16px' }}>{m.title}</h3>
                      {m.confirmed ? (
                        <Badge type="success">Confirmed</Badge>
                      ) : (
                        <Badge type="warning">Awaiting Confirmation</Badge>
                      )}
                    </div>
                    <div className="text-muted flex items-center gap-2" style={{ fontSize: '14px' }}>
                      <span>{format(new Date(`2000-01-01T${m.time}`), 'h:mm a')}</span>
                      {m.link && (
                        <>
                          <span>•</span>
                          <a href={m.link} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                            <LinkIcon size={12} /> Join Link
                          </a>
                        </>
                      )}
                    </div>
                    {m.notes && <p style={{ fontSize: '14px', marginTop: '4px', color: '#4b5563' }}>{m.notes}</p>}
                  </div>
                </div>
                {!isTeam && !m.confirmed && (
                  <button className="btn btn-client" onClick={() => handleConfirm(m.id)}>
                    <CheckCircle2 size={16} /> Confirm
                  </button>
                )}
              </Card>
            ))}
          </div>

          {pastMeetings.length > 0 && (
            <div className="flex-col gap-4 mt-4">
              <h2 className="text-lg text-muted">Past Meetings</h2>
              {pastMeetings.map(m => (
                <Card key={m.id} style={{ opacity: 0.7, padding: '16px' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '15px' }}>{m.title}</h3>
                      <div className="text-muted" style={{ fontSize: '13px' }}>
                        {format(new Date(`${m.date}T${m.time}`), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <Badge type="default">Past</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
