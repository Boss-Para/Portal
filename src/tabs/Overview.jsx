import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';

const PHASES = [
  { id: 1, name: 'Discovery & Design', status: 'completed', progress: 100, milestone: '₹10,000', weeks: 'Week 1-2' },
  { id: 2, name: 'Core Development', status: 'in-progress', progress: 65, milestone: '₹15,000', weeks: 'Week 3-5' },
  { id: 3, name: 'Refinement & Testing', status: 'pending', progress: 0, milestone: '₹10,000', weeks: 'Week 6-7' },
  { id: 4, name: 'Launch & Handover', status: 'pending', progress: 0, milestone: '₹5,000', weeks: 'Week 8' },
];

const SCOPE_ITEMS = [
  'User Authentication & Roles',
  'Real-time Chat & Comments',
  'Ticket Management System',
  'Meeting Scheduler Integration',
  'Access Request Approvals',
  'Responsive UI/UX Design'
];

export default function Overview({ profile }) {
  const isTeam = profile?.role === 'team';
  const accentColor = isTeam ? 'var(--color-team)' : 'var(--color-client)';

  return (
    <div className="flex-col gap-6">
      <div>
        <h1 className="text-2xl">Project Overview</h1>
        <p className="text-muted mt-4">Track progress, milestones, and project scope.</p>
      </div>

      <div className="grid-3">
        <Card>
          <p className="text-muted mb-4">Total Budget</p>
          <h2 className="text-2xl">₹40,000</h2>
        </Card>
        <Card>
          <p className="text-muted mb-4">Amount Paid</p>
          <h2 className="text-2xl" style={{ color: 'var(--color-success)' }}>₹10,000</h2>
        </Card>
        <Card>
          <p className="text-muted mb-4">Next Milestone</p>
          <h2 className="text-2xl">₹15,000</h2>
          <p className="text-muted mt-4" style={{ fontSize: '12px' }}>Core Development</p>
        </Card>
      </div>

      <h2 className="text-xl mt-4">Phase Progress</h2>
      <div className="flex-col gap-4">
        {PHASES.map(phase => (
          <Card key={phase.id} style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>0{phase.id}</span>
                <h3 className="text-lg">{phase.name}</h3>
                <Badge type={phase.status === 'completed' ? 'success' : phase.status === 'in-progress' ? 'warning' : 'default'}>
                  {phase.status.replace('-', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted">
                <span>{phase.weeks}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{phase.milestone}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${phase.progress}%`, 
                  height: '100%', 
                  backgroundColor: phase.status === 'completed' ? 'var(--color-success)' : accentColor,
                  borderRadius: '4px'
                }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, width: '40px', textAlign: 'right' }}>
                {phase.progress}%
              </span>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="text-xl mt-4">Scope of Work</h2>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {SCOPE_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
