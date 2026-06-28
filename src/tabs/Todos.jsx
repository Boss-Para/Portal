import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { CheckSquare, Loader2, CheckCircle2, Circle, Activity } from 'lucide-react';

export default function Todos({ profile }) {
  const [todos, setTodos] = useState([]);
  const [phases, setPhases] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isTeam = profile?.role === 'team';

  useEffect(() => {
    fetchData();
    
    const channels = [
      supabase.channel('public:todos').on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, fetchData).subscribe(),
      supabase.channel('public:phases').on('postgres_changes', { event: '*', schema: 'public', table: 'phases' }, fetchData).subscribe(),
      supabase.channel('public:activity_logs').on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, fetchLogs).subscribe()
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [todosRes, phasesRes] = await Promise.all([
      supabase.from('todos').select('*').order('created_at', { ascending: true }),
      supabase.from('phases').select('*').order('order_index', { ascending: true })
    ]);
      
    if (todosRes.error) setError(todosRes.error.message);
    else setTodos(todosRes.data);

    if (phasesRes.error) setError(phasesRes.error.message);
    else setPhases(phasesRes.data);
    
    await fetchLogs();
    
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setLogs(data);
  };

  const toggleDone = async (todo) => {
    if (!isTeam) return;
    const newDone = !todo.done;
    
    // 1. Update todo
    await supabase.from('todos').update({ done: newDone }).eq('id', todo.id);
    
    // 2. Log activity
    await supabase.from('activity_logs').insert([{
      action_text: `marked "${todo.text}" as ${newDone ? 'complete' : 'incomplete'}`,
      created_by: profile.name || profile.username
    }]);

    // 3. Update phase progress
    if (todo.phase_id) {
      const phaseTasks = todos.filter(t => t.phase_id === todo.phase_id);
      const completed = phaseTasks.filter(t => t.id === todo.id ? newDone : t.done).length;
      const progress = phaseTasks.length > 0 ? Math.round((completed / phaseTasks.length) * 100) : 0;
      
      // Also update status if completed
      let status = 'pending';
      if (progress > 0) status = 'in-progress';
      if (progress === 100) status = 'completed';

      await supabase.from('phases').update({ progress, status }).eq('id', todo.phase_id);
    }
  };

  if (loading && todos.length === 0) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  // Group todos by phase
  const groupedTodos = {};
  phases.forEach(p => groupedTodos[p.id] = []);
  const unassigned = [];
  
  todos.forEach(t => {
    if (t.phase_id && groupedTodos[t.phase_id]) {
      groupedTodos[t.phase_id].push(t);
    } else {
      unassigned.push(t);
    }
  });

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">To-Do List</h1>
          <p className="text-muted mt-2">Track actionable steps and tasks, automatically synced with Phase Progress.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {phases.map(phase => {
        const tasks = groupedTodos[phase.id];
        if (!tasks || tasks.length === 0) return null;
        
        return (
          <div key={phase.id} className="mb-8">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <span style={{ color: 'var(--color-team)' }}>0{phase.order_index}</span> 
              {phase.name}
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                {phase.progress}% Complete
              </span>
            </h2>
            <div className="flex-col gap-3">
              {tasks.map(todo => (
                <Card key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', opacity: todo.done ? 0.6 : 1, transition: 'all 0.2s', borderLeft: todo.done ? '4px solid var(--color-success)' : '4px solid transparent' }}>
                  {isTeam ? (
                    <button onClick={() => toggleDone(todo)} style={{ color: todo.done ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0 }}>
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
          </div>
        );
      })}

      {unassigned.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl mb-4">Unassigned Tasks</h2>
          <div className="flex-col gap-3">
            {unassigned.map(todo => (
               <Card key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', opacity: todo.done ? 0.6 : 1 }}>
                 {isTeam ? (
                   <button onClick={() => toggleDone(todo)} style={{ color: todo.done ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0 }}>
                     {todo.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                   </button>
                 ) : (
                   <div style={{ color: todo.done ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0 }}>
                     {todo.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                   </div>
                 )}
                 <div style={{ flex: 1 }}>
                   <p style={{ fontSize: '15px', fontWeight: 500, textDecoration: todo.done ? 'line-through' : 'none' }}>
                     {todo.text}
                   </p>
                 </div>
               </Card>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log Feed */}
      <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <h2 className="text-lg mb-4 flex items-center gap-2"><Activity size={18} /> Recent Activity</h2>
        {logs.length === 0 ? (
          <p className="text-muted text-sm">No recent activity.</p>
        ) : (
          <div className="flex-col gap-2">
            {logs.map(log => (
              <div key={log.id} style={{ fontSize: '13px', padding: '8px 12px', backgroundColor: 'var(--color-bg-offset)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{log.created_by}</span>{' '}
                <span className="text-muted">{log.action_text}</span>{' '}
                <span style={{ color: 'var(--color-border)', marginLeft: '8px', fontSize: '11px' }}>
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
