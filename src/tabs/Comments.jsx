import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { Send, Pin, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function Comments({ profile }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchComments();
    
    const subscription = supabase
      .channel('public:comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, payload => {
        if (payload.eventType === 'INSERT') {
          fetchSingleComment(payload.new.id);
        } else if (payload.eventType === 'UPDATE') {
          setComments(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles(name, avatar, role)')
      .order('created_at', { ascending: true });

    if (error) setError('Failed to load comments');
    else setComments(data);
    setLoading(false);
  };

  const fetchSingleComment = async (id) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles(name, avatar, role)')
      .eq('id', id)
      .single();
      
    if (data && !error) {
      setComments(prev => {
        if (prev.find(c => c.id === id)) return prev;
        return [...prev, data];
      });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    
    const { error } = await supabase.from('comments').insert([
      { author_id: profile.id, text: text.trim() }
    ]);
    
    if (error) setError(error.message);
    else setText('');
    
    setSending(false);
  };

  const togglePin = async (id, currentPinned) => {
    if (!isTeam) return;
    await supabase.from('comments').update({ pinned: !currentPinned }).eq('id', id);
  };

  const pinnedComments = comments.filter(c => c.pinned);
  const regularComments = comments.filter(c => !c.pinned);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col" style={{ height: 'calc(100vh - 104px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <div className="error-message">{error}</div>}
        
        {pinnedComments.length > 0 && (
          <div style={{ position: 'sticky', top: 0, zIndex: 10, marginBottom: '16px' }}>
            <Card style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', padding: '12px 16px' }}>
              <div className="flex items-center gap-2 mb-2 text-muted" style={{ fontSize: '12px', fontWeight: 600, color: '#d97706' }}>
                <Pin size={14} /> Pinned Message
              </div>
              {pinnedComments.map(c => (
                <div key={c.id} style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, marginRight: '8px' }}>{c.author?.name}:</span>
                  {c.text}
                  {isTeam && (
                    <button onClick={() => togglePin(c.id, true)} style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280', textDecoration: 'underline' }}>Unpin</button>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}

        {regularComments.length === 0 && pinnedComments.length === 0 ? (
          <EmptyState icon={MessageSquare} message="No messages yet. Start the conversation." />
        ) : (
          regularComments.map(comment => {
            const isMe = comment.author_id === profile.id;
            return (
              <div key={comment.id} className="flex gap-3" style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <Avatar name={comment.author?.name} role={comment.author?.role} size={32} />
                <div className="flex-col gap-1" style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div className="flex items-center gap-2 text-muted" style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 500 }}>{comment.author?.name}</span>
                    <span>{format(new Date(comment.created_at), 'MMM d, p')}</span>
                    {isTeam && !isMe && (
                      <button onClick={() => togglePin(comment.id, false)} title="Pin Message"><Pin size={12} /></button>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: isMe ? (isTeam ? 'var(--color-team)' : 'var(--color-client)') : 'var(--color-card)',
                    color: isMe ? 'white' : 'var(--color-text-main)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isMe ? 'none' : '1px solid var(--color-border)',
                    borderTopRightRadius: isMe ? '4px' : '12px',
                    borderTopLeftRadius: !isMe ? '4px' : '12px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {comment.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="input-field"
            placeholder="Type your message..."
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={sending}
            style={{ borderRadius: '24px', paddingLeft: '20px' }}
          />
          <button 
            type="submit" 
            disabled={sending || !text.trim()} 
            className={`btn ${isTeam ? 'btn-team' : 'btn-client'}`}
            style={{ borderRadius: '24px', padding: '10px 20px' }}
          >
            {sending ? <Loader2 size={18} className="spin" /> : <><Send size={16} /> Send</>}
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
