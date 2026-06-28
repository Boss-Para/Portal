import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { Ticket as TicketIcon, Loader2, Plus, MessageSquare, ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function Tickets({ profile }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [view, setView] = useState('list'); // 'list', 'detail', 'create'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newPhase, setNewPhase] = useState('1');
  const [newPriority, setNewPriority] = useState('medium');

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (view === 'detail' && selectedTicket) {
      fetchReplies(selectedTicket.id);
      
      const subscription = supabase
        .channel(`ticket_replies:${selectedTicket.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies', filter: `ticket_id=eq.${selectedTicket.id}` }, payload => {
          fetchSingleReply(payload.new.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [view, selectedTicket]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*, author:profiles(name, avatar, role)')
      .order('created_at', { ascending: false });
    
    if (error) setError(error.message);
    else {
      // Also fetch reply counts
      const counts = await Promise.all(data.map(async t => {
        const { count } = await supabase.from('ticket_replies').select('*', { count: 'exact', head: true }).eq('ticket_id', t.id);
        return { ...t, replyCount: count || 0 };
      }));
      setTickets(counts);
    }
    setLoading(false);
  };

  const fetchReplies = async (ticketId) => {
    const { data, error } = await supabase
      .from('ticket_replies')
      .select('*, author:profiles(name, avatar, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
      
    if (!error) setReplies(data);
  };

  const fetchSingleReply = async (replyId) => {
    const { data, error } = await supabase
      .from('ticket_replies')
      .select('*, author:profiles(name, avatar, role)')
      .eq('id', replyId)
      .single();
    if (data && !error) {
      setReplies(prev => [...prev, data]);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSending(true);
    
    const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
    const nextId = `T-${String((count || 0) + 1).padStart(3, '0')}`;
    
    const { error } = await supabase.from('tickets').insert([{
      id: nextId,
      title: newTitle,
      phase: parseInt(newPhase),
      priority: newPriority,
      author_id: profile.id,
      assignee_role: isTeam ? 'team' : 'client'
    }]);

    if (!error) {
      setNewTitle('');
      setView('list');
      fetchTickets();
    } else {
      setError(error.message);
    }
    setSending(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);

    const { error: replyError } = await supabase.from('ticket_replies').insert([{
      ticket_id: selectedTicket.id,
      author_id: profile.id,
      text: replyText.trim()
    }]);

    if (!replyError) {
      const newStatus = isTeam ? 'pending-client' : 'open';
      await supabase.from('tickets').update({ status: newStatus }).eq('id', selectedTicket.id);
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus, replyCount: t.replyCount + 1 } : t));
      setReplyText('');
    }
    setSending(false);
  };

  const handleCloseTicket = async (id) => {
    if (!isTeam) return;
    await supabase.from('tickets').update({ status: 'closed' }).eq('id', id);
    setSelectedTicket(prev => ({ ...prev, status: 'closed' }));
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'closed' } : t));
  };

  if (loading && view === 'list') return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col gap-6">
      {error && <div className="error-message">{error}</div>}

      {view === 'list' && (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl">Tickets</h1>
            <button className={`btn ${isTeam ? 'btn-team' : 'btn-client'}`} onClick={() => setView('create')}>
              <Plus size={16} /> New Ticket
            </button>
          </div>

          {tickets.length === 0 ? (
            <EmptyState icon={TicketIcon} message="No tickets yet. Create one to track a task or issue." />
          ) : (
            <div className="flex-col gap-3">
              {tickets.map(ticket => (
                <Card key={ticket.id} className="cursor-pointer hover-bg" style={{ padding: '16px', transition: 'background 0.2s', cursor: 'pointer' }}>
                  <div onClick={() => { setSelectedTicket(ticket); setView('detail'); }} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', width: '50px' }}>{ticket.id}</span>
                      <div className="flex-col gap-1">
                        <span style={{ fontWeight: 600 }}>{ticket.title}</span>
                        <div className="flex items-center gap-3 text-muted" style={{ fontSize: '13px' }}>
                          <span>Phase {ticket.phase}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><MessageSquare size={12} /> {ticket.replyCount}</span>
                          <span>•</span>
                          <span>{format(new Date(ticket.created_at), 'MMM d')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge type={ticket.priority}>{ticket.priority}</Badge>
                      <Badge type={ticket.status}>{ticket.status.replace('-', ' ')}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'create' && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <button className="btn btn-outline" onClick={() => setView('list')}><ArrowLeft size={16} /> Back</button>
            <h1 className="text-xl">Create New Ticket</h1>
          </div>
          <Card style={{ maxWidth: '600px' }}>
            <form onSubmit={handleCreateTicket} className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Ticket Title</label>
                <input required type="text" className="input-field" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g., Update logo on login screen" />
              </div>
              <div className="flex gap-4">
                <div className="flex-col gap-2" style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>Phase</label>
                  <select className="input-field" value={newPhase} onChange={e => setNewPhase(e.target.value)}>
                    <option value="1">Phase 1: Discovery</option>
                    <option value="2">Phase 2: Core Dev</option>
                    <option value="3">Phase 3: Testing</option>
                    <option value="4">Phase 4: Launch</option>
                  </select>
                </div>
                <div className="flex-col gap-2" style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>Priority</label>
                  <select className="input-field" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={sending} className={`btn mt-2 ${isTeam ? 'btn-team' : 'btn-client'}`} style={{ alignSelf: 'flex-start' }}>
                {sending ? <Loader2 size={16} className="spin" /> : 'Create Ticket'}
              </button>
            </form>
          </Card>
        </>
      )}

      {view === 'detail' && selectedTicket && (
        <div className="flex-col gap-6" style={{ height: 'calc(100vh - 150px)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="btn btn-outline" onClick={() => { setView('list'); setSelectedTicket(null); }}><ArrowLeft size={16} /> Back</button>
              <h1 className="text-xl">{selectedTicket.id}: {selectedTicket.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge type={selectedTicket.priority}>{selectedTicket.priority}</Badge>
              <Badge type={selectedTicket.status}>{selectedTicket.status.replace('-', ' ')}</Badge>
              {isTeam && selectedTicket.status !== 'closed' && (
                <button className="btn btn-outline" onClick={() => handleCloseTicket(selectedTicket.id)}>Mark Closed</button>
              )}
            </div>
          </div>

          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fafafa' }}>
              <div className="flex items-center gap-3 mb-2">
                <Avatar name={selectedTicket.author?.name} role={selectedTicket.author?.role} size={28} />
                <span style={{ fontWeight: 500, fontSize: '14px' }}>{selectedTicket.author?.name}</span>
                <span className="text-muted" style={{ fontSize: '12px' }}>opened this ticket on {format(new Date(selectedTicket.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {replies.map(reply => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar name={reply.author?.name} role={reply.author?.role} size={32} />
                  <div className="flex-col gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{reply.author?.name}</span>
                      <span className="text-muted" style={{ fontSize: '12px' }}>{format(new Date(reply.created_at), 'MMM d, p')}</span>
                    </div>
                    <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px' }}>
                      {reply.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'closed' && (
              <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)' }}>
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !replyText.trim()} className={`btn ${isTeam ? 'btn-team' : 'btn-client'}`}>
                    {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            )}
            {selectedTicket.status === 'closed' && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
                This ticket has been closed.
              </div>
            )}
          </Card>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg:hover { background-color: #fafafa !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
