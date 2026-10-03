import { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Library from './pages/Library';
import MediaDetails from './pages/MediaDetails';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMediaId, setSelectedMediaId] = useState(null);

  const handleSelectMedia = (id) => {
    setSelectedMediaId(id);
    setActiveTab('details');
  };

  const handleBackToLibrary = () => {
    setActiveTab('library');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab !== 'details') {
            setSelectedMediaId(null);
          }
          setActiveTab(tab);
        }}
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
        {activeTab === 'details' && (
          <MediaDetails
            mediaId={selectedMediaId}
            onBack={handleBackToLibrary}
          />
        )}
      </main>
    </div>
  );
}

export default App;
