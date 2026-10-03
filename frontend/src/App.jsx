import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Library from './pages/Library';
import MediaDetails from './pages/MediaDetails';
import { getMedia } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalAssets, setTotalAssets] = useState(0);

  const fetchAssetCount = async () => {
    try {
      const data = await getMedia();
      if (data && Array.isArray(data.media)) {
        setTotalAssets(data.media.length);
      }
    } catch (err) {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchAssetCount();
  }, [activeTab]);

  const handleSelectMedia = (id) => {
    setSelectedMediaId(id);
    setActiveTab('details');
  };

  const handleBackToLibrary = () => {
    setActiveTab('library');
  };

  const handleSearchSubmit = (q) => {
    if (q) {
      setActiveTab('library');
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
        totalAssets={totalAssets}
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
              initialQuery={searchQuery}
              onSelectMedia={handleSelectMedia}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'studio' && (
            <Dashboard
              onNavigateToUpload={() => setActiveTab('upload')}
              onNavigateToLibrary={() => setActiveTab('library')}
            />
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
