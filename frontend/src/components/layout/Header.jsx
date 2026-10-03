import React from 'react';
import { Search, Bell } from 'lucide-react';

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
          placeholder="Search media, tags, people, or anything..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className="search-kbd">⌘ K</span>
      </div>

      <div className="header-actions">
        <button className="notification-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-badge"></span>
        </button>

        <div className="user-profile">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
            alt="Sarah Chen"
            className="user-avatar"
          />
          <div className="user-details">
            <h4>Sarah Chen</h4>
            <span>Pro Plan</span>
          </div>
        </div>
      </div>
    </header>
  );
}
