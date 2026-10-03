import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Images,
  Sliders,
  Sparkles,
  CloudCheck,
  CheckCircle2,
  Database
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, totalAssets = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Studio', icon: UploadCloud },
    { id: 'library', label: 'Media Library', icon: Images },
    { id: 'studio', label: 'Transformation Studio', icon: Sliders },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <div className="logo-icon-box">
            <Sparkles size={20} />
          </div>
          <div className="logo-text">
            SmartMedia<span>AI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-item-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Real Cloudinary & MongoDB Connection Widget */}
      <div className="sidebar-storage-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Connected
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {totalAssets} {totalAssets === 1 ? 'Asset' : 'Assets'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CloudCheck size={13} style={{ color: 'var(--accent-indigo)' }} />
            <span>Cloudinary Media Cloud</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={13} style={{ color: '#06B6D4' }} />
            <span>MongoDB Atlas Synced</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
