import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Loader Component
 */
export default function Loader({ size = 24, text = 'Loading...', style = {} }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '12px',
        color: '#6b7280',
        ...style,
      }}
    >
      <Loader2
        size={size}
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && <span style={{ fontSize: '14px' }}>{text}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
