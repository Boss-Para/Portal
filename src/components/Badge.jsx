import React from 'react';

export default function Badge({ children, type }) {
  let color = '#6b7280'; // default gray
  
  if (type === 'high' || type === 'danger' || type === 'denied') color = '#ef4444';
  if (type === 'medium' || type === 'warning' || type === 'pending-client' || type === 'pending') color = '#f59e0b';
  if (type === 'low' || type === 'open') color = '#3b82f6';
  if (type === 'success' || type === 'closed' || type === 'granted' || type === 'confirmed') color = '#22c55e';
  if (type === 'team') color = 'var(--color-team)';
  if (type === 'client') color = 'var(--color-client)';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: `${color}26`, // 15% opacity hex
      color: color,
      border: `1px solid ${color}40`,
      textTransform: 'capitalize'
    }}>
      {children}
    </span>
  );
}
