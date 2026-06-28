import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { CheckSquare, Plus, Loader2, CheckCircle2, Circle } from 'lucide-react';

export default function Todos({ profile }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchTodos();
    
    const subscription = supabase
      .channel('public:todos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, payload => {
        fetchTodos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) setError(error.message);
    else setTodos(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isTeam) return;
    setSending(true);
    
    const { error } = await supabase.from('todos').insert([{
      text: newText
    }]);

    if (!error) {
      setNewText('');
      setShowForm(false);
    } else setError(error.message);
    setSending(false);
  };

  const toggleDone = async (id, currentDone) => {
    if (!isTeam) return;
    await supabase.from('todos').update({ done: !currentDone }).eq('id', id);
  };

  if (loading && todos.length === 0) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">To-Do List</h1>
          <p className="text-muted mt-2">Track actionable steps and tasks.</p>
        </div>
        {isTeam && (
          <button className="btn btn-team" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'Add Task'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && isTeam && (
        <Card style={{ backgroundColor: '#fafafa', border: '1px solid var(--color-team)' }}>
          <form onSubmit={handleCreate} className="flex gap-4">
            <input 
              required 
              type="text" 
              className="input-field" 
              value={newText} 
              onChange={e => setNewText(e.target.value)} 
              placeholder="e.g., Set up domain name..." 
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={sending} className="btn btn-team">
              {sending ? <Loader2 size={16} className="spin" /> : 'Add'}
            </button>
          </form>
        </Card>
      )}

      {todos.length === 0 ? (
        <EmptyState icon={CheckSquare} message="No tasks added yet." />
      ) : (
        <div className="flex-col gap-3">
          {todos.map(todo => (
            <Card key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', opacity: todo.done ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {isTeam ? (
                <button onClick={() => toggleDone(todo.id, todo.done)} style={{ color: todo.done ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0 }}>
                  {todo.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
              ) : (
                <div style={{ color: todo.done ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0 }}>
                  {todo.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: 500, textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                  {todo.text}
                </p>
              </div>
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
