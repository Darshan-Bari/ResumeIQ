import React from 'react';

function GlassCard({ className = '', hoverable = true, children }) {
  return (
    <div className={`glass-card ${hoverable ? 'glass-card-hover' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}

export default GlassCard;
