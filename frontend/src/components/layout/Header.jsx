import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';

export default function Header({ searchQuery, onSearchChange, onSearchSubmit }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="top-header">
      <div className="header-search">
        <Search className="search-icon-left" />
        <input
          type="text"
          placeholder="Search media by tags, filename, format..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className="search-kbd">⌘ K</span>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <ShieldCheck size={14} style={{ color: '#818CF8' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#C7D2FE' }}>
            HackIndia 2026 Cloudinary Track
          </span>
        </div>
      </div>
    </header>
  );
}
