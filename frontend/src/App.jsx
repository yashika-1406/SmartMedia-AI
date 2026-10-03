import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Library from './pages/Library';
import MediaDetails from './pages/MediaDetails';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectMedia = (id) => {
    setSelectedMediaId(id);
    setActiveTab('details');
  };

  const handleBackToLibrary = () => {
    setActiveTab('library');
  };

  const handleSearchSubmit = (q) => {
    if (q) {
      setActiveTab('search');
    }
  };

  return (
    <div className="app-container">
      {/* 1. Permanent Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab !== 'details') {
            setSelectedMediaId(null);
          }
          setActiveTab(tab);
        }}
      />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        <main style={{ flex: 1, width: '100%' }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateToUpload={() => setActiveTab('upload')}
              onNavigateToLibrary={() => setActiveTab('library')}
            />
          )}

          {activeTab === 'upload' && (
            <Upload onNavigateToLibrary={() => setActiveTab('library')} />
          )}

          {activeTab === 'library' && (
            <Library
              onSelectMedia={handleSelectMedia}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'search' && (
            <Library
              initialQuery={searchQuery}
              onSelectMedia={handleSelectMedia}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'transformations' && (
            <Dashboard
              onNavigateToUpload={() => setActiveTab('upload')}
              onNavigateToLibrary={() => setActiveTab('library')}
            />
          )}

          {activeTab === 'video' && (
            <Library
              initialQuery="video"
              onSelectMedia={handleSelectMedia}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'analytics' && (
            <Dashboard
              onNavigateToUpload={() => setActiveTab('upload')}
              onNavigateToLibrary={() => setActiveTab('library')}
            />
          )}

          {activeTab === 'settings' && (
            <div style={{ padding: '40px 32px' }}>
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
                  SmartMedia AI Environment Settings
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Backend connected to Cloudinary API and MongoDB Atlas.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div><strong>Live Backend:</strong> https://smartmedia-ai.onrender.com/api</div>
                  <div><strong>Cloudinary Cloud:</strong> lj3aht9j</div>
                  <div><strong>Database:</strong> MongoDB Atlas (Connected)</div>
                  <div><strong>Version:</strong> SmartMedia AI v1.0.0 (HackIndia 2026)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <MediaDetails
              mediaId={selectedMediaId}
              onBack={handleBackToLibrary}
            />
          )}
        </main>
      </div>
    </div>
  );
}
