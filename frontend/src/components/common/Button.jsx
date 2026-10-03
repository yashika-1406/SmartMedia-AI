import React from 'react';

/**
 * Reusable Button Component
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  icon: Icon,
  style = {},
  ...props
}) {
  const isPrimary = variant === 'primary';
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    border: isPrimary ? 'none' : '1px solid var(--border, #d1d5db)',
    backgroundColor: isPrimary ? 'var(--accent, #6366f1)' : 'transparent',
    color: isPrimary ? '#ffffff' : 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    ...style,
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={baseStyle} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
