import React from 'react';
import { Sparkles, LayoutDashboard, UploadCloud, Film } from 'lucide-react';

/**
 * Top Navigation Bar
 */
export default function Navbar({ activeTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload', icon: UploadCloud },
    { id: 'library', label: 'Media Library', icon: Film },
  ];

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border, #e5e7eb)',
        backgroundColor: 'var(--bg, #ffffff)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo - clicking returns to Dashboard */}
        <div
          onClick={() => onSelectTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', lineHeight: 1.2 }}>SmartMedia AI</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Intelligent Media Pipeline</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            // When in details view, highlight Media Library as active section
            const isActive = activeTab === item.id || (item.id === 'library' && activeTab === 'details');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--accent-bg, rgba(99, 102, 241, 0.1))' : 'transparent',
                  color: isActive ? 'var(--accent, #6366f1)' : 'var(--text, #6b7280)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
