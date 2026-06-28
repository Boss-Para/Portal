import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Loader2, Edit2, Check, X, Plus, Trash2 } from 'lucide-react';

export default function Overview({ profile }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [details, setDetails] = useState(null);
  const [phases, setPhases] = useState([]);
  const [scopeItems, setScopeItems] = useState([]);

  // Edit states
  const [editingBudget, setEditingBudget] = useState(false);
  const [editBudgetData, setEditBudgetData] = useState({ total: 0, paid: 0 });

  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [editPhaseData, setEditPhaseData] = useState(null);

  const [newScopeText, setNewScopeText] = useState('');

  const isTeam = profile?.role === 'team';
  const accentColor = isTeam ? 'var(--color-team)' : 'var(--color-client)';

  useEffect(() => {
    fetchData();

    const channels = [
      supabase.channel('public:project_details').on('postgres_changes', { event: '*', schema: 'public', table: 'project_details' }, fetchData).subscribe(),
      supabase.channel('public:phases').on('postgres_changes', { event: '*', schema: 'public', table: 'phases' }, fetchData).subscribe(),
      supabase.channel('public:scope_items').on('postgres_changes', { event: '*', schema: 'public', table: 'scope_items' }, fetchData).subscribe()
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [detailsRes, phasesRes, scopeRes] = await Promise.all([
      supabase.from('project_details').select('*').limit(1).single(),
      supabase.from('phases').select('*').order('order_index'),
      supabase.from('scope_items').select('*').order('order_index')
    ]);

    if (detailsRes.error && detailsRes.error.code !== 'PGRST116') setError(detailsRes.error.message);
    else setDetails(detailsRes.data);

    if (phasesRes.error) setError(phasesRes.error.message);
    else setPhases(phasesRes.data || []);

    if (scopeRes.error) setError(scopeRes.error.message);
    else setScopeItems(scopeRes.data || []);

    setLoading(false);
  };

  // --- Handlers ---
  const handleSaveBudget = async () => {
    if (!details?.id) return;
    await supabase.from('project_details').update({ 
      total_budget: editBudgetData.total, 
      amount_paid: editBudgetData.paid 
    }).eq('id', details.id);
    setEditingBudget(false);
  };

  const handleSavePhase = async (id) => {
    await supabase.from('phases').update({
      name: editPhaseData.name,
      status: editPhaseData.status,
      progress: editPhaseData.progress,
      milestone_amount: editPhaseData.milestone_amount,
      weeks: editPhaseData.weeks
    }).eq('id', id);
    setEditingPhaseId(null);
  };

  const handleAddScope = async (e) => {
    e.preventDefault();
    if (!newScopeText.trim()) return;
    const order = scopeItems.length > 0 ? Math.max(...scopeItems.map(s => s.order_index)) + 1 : 1;
    await supabase.from('scope_items').insert([{ text: newScopeText, order_index: order }]);
    setNewScopeText('');
  };

  const handleDeleteScope = async (id) => {
    await supabase.from('scope_items').delete().eq('id', id);
  };

  const formatCurrency = (val) => {
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  if (loading && !details) return <div className="flex items-center justify-center h-full"><Loader2 className="spin" size={32} /></div>;

  const total = details?.total_budget || 0;
  const paid = details?.amount_paid || 0;
  
  // Calculate next milestone (first phase that is not completed)
  const nextPhase = phases.find(p => p.status !== 'completed');
  const nextMilestone = nextPhase ? nextPhase.milestone_amount : '₹0';
  const nextPhaseName = nextPhase ? nextPhase.name : 'All Complete';

  return (
    <div className="flex-col gap-6">
      {error && <div className="error-message">{error}</div>}

      <div>
        <h1 className="text-2xl">Project Overview</h1>
        <p className="text-muted mt-4">Track progress, milestones, and project scope.</p>
      </div>

      <div className="grid-3 relative">
        {isTeam && (
          <button 
            className="btn btn-outline" 
            style={{ position: 'absolute', top: '-40px', right: '0', padding: '6px 12px', fontSize: '12px' }}
            onClick={() => {
              setEditBudgetData({ total, paid });
              setEditingBudget(true);
            }}
          >
            <Edit2 size={12} /> Edit Budget
          </button>
        )}

        <Card>
          <p className="text-muted mb-4">Total Budget</p>
          {editingBudget ? (
            <input type="number" className="input-field" value={editBudgetData.total} onChange={e => setEditBudgetData({...editBudgetData, total: e.target.value})} />
          ) : (
            <h2 className="text-2xl">{formatCurrency(total)}</h2>
          )}
        </Card>
        <Card>
          <p className="text-muted mb-4">Amount Paid</p>
          {editingBudget ? (
            <input type="number" className="input-field" value={editBudgetData.paid} onChange={e => setEditBudgetData({...editBudgetData, paid: e.target.value})} />
          ) : (
            <h2 className="text-2xl" style={{ color: 'var(--color-success)' }}>{formatCurrency(paid)}</h2>
          )}
        </Card>
        <Card>
          <p className="text-muted mb-4">Next Milestone</p>
          <h2 className="text-2xl">{nextMilestone}</h2>
          <p className="text-muted mt-4" style={{ fontSize: '12px' }}>{nextPhaseName}</p>
        </Card>
      </div>

      {editingBudget && (
        <div className="flex gap-2">
          <button className="btn btn-team" onClick={handleSaveBudget}><Check size={16} /> Save Budget</button>
          <button className="btn btn-outline" onClick={() => setEditingBudget(false)}><X size={16} /> Cancel</button>
        </div>
      )}

      <h2 className="text-xl mt-4">Phase Progress</h2>
      <div className="flex-col gap-4">
        {phases.map(phase => {
          const isEditing = editingPhaseId === phase.id;
          
          return (
            <Card key={phase.id} style={{ padding: '24px' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>0{phase.order_index}</span>
                  
                  {isEditing ? (
                    <input type="text" className="input-field" value={editPhaseData.name} onChange={e => setEditPhaseData({...editPhaseData, name: e.target.value})} />
                  ) : (
                    <h3 className="text-lg">{phase.name}</h3>
                  )}

                  {isEditing ? (
                    <select className="input-field" style={{ width: 'auto' }} value={editPhaseData.status} onChange={e => setEditPhaseData({...editPhaseData, status: e.target.value})}>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : (
                    <Badge type={phase.status === 'completed' ? 'success' : phase.status === 'in-progress' ? 'warning' : 'default'}>
                      {phase.status.replace('-', ' ')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-muted">
                  {isEditing ? (
                    <>
                      <input type="text" className="input-field" placeholder="Weeks" value={editPhaseData.weeks} onChange={e => setEditPhaseData({...editPhaseData, weeks: e.target.value})} style={{ width: '100px' }} />
                      <input type="text" className="input-field" placeholder="Milestone" value={editPhaseData.milestone_amount} onChange={e => setEditPhaseData({...editPhaseData, milestone_amount: e.target.value})} style={{ width: '100px' }} />
                    </>
                  ) : (
                    <>
                      <span>{phase.weeks}</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{phase.milestone_amount}</span>
                    </>
                  )}

                  {isTeam && (
                    isEditing ? (
                      <div className="flex gap-2">
                        <button className="btn btn-team" style={{ padding: '6px' }} onClick={() => handleSavePhase(phase.id)}><Check size={14} /></button>
                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setEditingPhaseId(null)}><X size={14} /></button>
                      </div>
                    ) : (
                      <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => {
                        setEditPhaseData(phase);
                        setEditingPhaseId(phase.id);
                      }}>
                        <Edit2 size={12} /> Edit
                      </button>
                    )
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: \`\${isEditing ? editPhaseData.progress : phase.progress}%\`, 
                    height: '100%', 
                    backgroundColor: (isEditing ? editPhaseData.status : phase.status) === 'completed' ? 'var(--color-success)' : accentColor,
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }} />
                </div>
                {isEditing ? (
                  <input type="number" min="0" max="100" className="input-field" style={{ width: '70px' }} value={editPhaseData.progress} onChange={e => setEditPhaseData({...editPhaseData, progress: parseInt(e.target.value) || 0})} />
                ) : (
                  <span style={{ fontSize: '14px', fontWeight: 600, width: '40px', textAlign: 'right' }}>
                    {phase.progress}%
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <h2 className="text-xl mt-4">Scope of Work</h2>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {scopeItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 group">
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: '14px', fontWeight: 500, flex: 1 }}>{item.text}</span>
                {isTeam && (
                  <button onClick={() => handleDeleteScope(item.id)} className="btn btn-outline group-hover:opacity-100 opacity-0 transition-opacity" style={{ padding: '4px', color: 'var(--color-danger)', borderColor: 'transparent' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isTeam && (
            <form onSubmit={handleAddScope} className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <input type="text" className="input-field" value={newScopeText} onChange={e => setNewScopeText(e.target.value)} placeholder="Add new scope item..." style={{ flex: 1 }} />
              <button type="submit" disabled={!newScopeText.trim()} className="btn btn-team"><Plus size={16} /> Add Scope</button>
            </form>
          )}
        </div>
      </Card>
      
      <style dangerouslySetInnerHTML={{__html: \`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      \`}} />
    </div>
  );
}
