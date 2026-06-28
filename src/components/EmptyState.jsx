import React from 'react';

export default function EmptyState({ message, icon: Icon }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px dashed var(--color-border)',
      color: 'var(--color-text-muted)',
      textAlign: 'center'
    }}>
      {Icon && <Icon size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />}
      <p style={{ fontSize: '15px', fontWeight: '500' }}>{message}</p>
    </div>
  );
}
