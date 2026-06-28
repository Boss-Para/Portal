import React from 'react';

export default function Avatar({ name, role, size = 40 }) {
  const getInitials = (n) => {
    if (!n) return '??';
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  const bgColor = role === 'team' ? 'var(--color-team)' : 'var(--color-client)';

  return (
    <div 
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        flexShrink: 0
      }}
    >
      {getInitials(name)}
    </div>
  );
}
