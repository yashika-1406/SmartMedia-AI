import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Images,
  Search,
  Sliders,
  Video,
  BarChart3,
  Settings,
  Sparkles,
  Zap
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload', icon: UploadCloud },
    { id: 'library', label: 'Media Library', icon: Images },
    { id: 'search', label: 'AI Search', icon: Search },
    { id: 'transformations', label: 'Transformations', icon: Sliders },
    { id: 'video', label: 'Video Pipeline', icon: Video },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
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

      <div className="sidebar-storage-card">
        <div className="storage-info">
          <div className="storage-ring-wrapper">
            <svg viewBox="0 0 36 36" style={{ width: '42px', height: '42px', transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#storageGrad)"
                strokeWidth="3.5"
                strokeDasharray="68, 100"
              />
              <defs>
                <linearGradient id="storageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="storage-percent" style={{ position: 'absolute' }}>68%</span>
          </div>
          <div className="storage-texts">
            <h4>Storage Used</h4>
            <p>68 GB of 100 GB</p>
          </div>
        </div>
        <button className="btn-upgrade">
          <Zap size={14} />
          <span>Upgrade Plan</span>
        </button>
      </div>
    </aside>
  );
}
