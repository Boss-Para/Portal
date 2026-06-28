import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { KeyRound, Plus, Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function AccessRequests({ profile }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newReason, setNewReason] = useState('');
  const [sending, setSending] = useState(false);

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchRequests();
    
    const subscription = supabase
      .channel('public:access_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, payload => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) setError(error.message);
    else setRequests(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isTeam) return;
    setSending(true);
    
    const { error } = await supabase.from('access_requests').insert([{
      item: newItem,
      reason: newReason,
      requested_by: profile.id
    }]);

    if (!error) {
      setNewItem(''); setNewReason('');
      setShowForm(false);
    } else setError(error.message);
    setSending(false);
  };

  const handleUpdateStatus = async (id, status) => {
    if (isTeam) return;
    await supabase.from('access_requests').update({ status }).eq('id', id);
  };

  if (loading && requests.length === 0) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Access Requests</h1>
          <p className="text-muted mt-2">Manage credentials and permissions.</p>
        </div>
        {isTeam && (
          <button className="btn btn-team" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'Request Access'}
          </button>
        )}
      </div>

      <div style={{ backgroundColor: isTeam ? 'rgba(108, 71, 255, 0.05)' : 'rgba(255, 107, 53, 0.05)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${isTeam ? 'var(--color-team)' : 'var(--color-client)'}` }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>
          {isTeam 
            ? "Request access to client's systems (e.g., hosting, domains, analytics). The client will review and grant or deny."
            : "Review access requests from the team. Grant access securely so they can proceed with development."}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && isTeam && (
        <Card style={{ backgroundColor: '#fafafa', border: '1px solid var(--color-team)' }}>
          <h2 className="text-lg mb-4">Request Access</h2>
          <form onSubmit={handleCreate} className="flex-col gap-4">
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>System / Item</label>
              <input required type="text" className="input-field" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="e.g., Vercel Hosting Account" />
            </div>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '14px', fontWeight: 500 }}>Reason (Optional)</label>
              <textarea className="input-field" rows={2} value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Why do you need this?"></textarea>
            </div>
            <button type="submit" disabled={sending} className="btn btn-team mt-2" style={{ alignSelf: 'flex-start' }}>
              {sending ? <Loader2 size={16} className="spin" /> : 'Send Request'}
            </button>
          </form>
        </Card>
      )}

      {requests.length === 0 ? (
        <EmptyState icon={KeyRound} message="No access requests sent yet." />
      ) : (
        <div className="grid-2">
          {requests.map(req => (
            <Card key={req.id} className="flex-col justify-between" style={{ padding: '20px' }}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 style={{ fontWeight: 600, fontSize: '16px' }}>{req.item}</h3>
                  <Badge type={req.status}>{req.status}</Badge>
                </div>
                {req.reason && <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>{req.reason}</p>}
                <p className="text-muted" style={{ fontSize: '12px' }}>Requested on {format(new Date(req.created_at), 'MMM d, yyyy')}</p>
              </div>
              
              {!isTeam && req.status === 'pending' && (
                <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button className="btn btn-client flex-1" onClick={() => handleUpdateStatus(req.id, 'granted')}>
                    <Check size={16} /> Grant
                  </button>
                  <button className="btn btn-outline flex-1" onClick={() => handleUpdateStatus(req.id, 'denied')} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                    <X size={16} /> Deny
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
