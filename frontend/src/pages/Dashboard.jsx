import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/dashboard/HeroBanner';
import MetricsRow from '../components/dashboard/MetricsRow';
import IngestionDropZone from '../components/dashboard/IngestionDropZone';
import MediaLibrarySection from '../components/dashboard/MediaLibrarySection';
import AiSearchSection from '../components/dashboard/AiSearchSection';
import AiAnalysisPanel from '../components/dashboard/AiAnalysisPanel';
import TransformationStudioPanel from '../components/dashboard/TransformationStudioPanel';
import { getMedia, deleteMedia } from '../services/api';

export default function Dashboard({ onNavigateToUpload, onNavigateToLibrary }) {
  const [mediaList, setMediaList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const data = await getMedia();
      if (data && Array.isArray(data.media)) {
        setMediaList(data.media);
        if (data.media.length > 0) {
          // Keep current selected media if still exists, otherwise select first
          setSelectedMedia((prev) => {
            const found = prev ? data.media.find((m) => m._id === prev._id) : null;
            return found || data.media[0];
          });
        } else {
          setSelectedMedia(null);
        }
      }
    } catch (err) {
      console.warn('Media list load notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUploadSuccess = (uploadedResult) => {
    loadMedia();
    if (uploadedResult && uploadedResult.media) {
      setSelectedMedia(uploadedResult.media);
    }
  };

  const handleDeleteMedia = async (id) => {
    try {
      await deleteMedia(id);
      loadMedia();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="content-body">
      {/* 1. Hero Banner with Parallax */}
      <HeroBanner onUploadClick={onNavigateToUpload} />

      {/* 2. 100% Real KPI Metrics calculated from Database assets */}
      <MetricsRow mediaList={mediaList} />

      {/* 3. Main Split Grid */}
      <div className="dashboard-grid">
        {/* Left Broad Workspace Column */}
        <div className="workspace-column">
          {/* Real Ingestion Dropzone */}
          <IngestionDropZone onUploadSuccess={handleUploadSuccess} />

          {/* Real Media Library Section */}
          <MediaLibrarySection
            mediaList={mediaList}
            selectedMedia={selectedMedia}
            onSelectMedia={(item) => setSelectedMedia(item)}
            onDeleteMedia={handleDeleteMedia}
            onViewAll={onNavigateToLibrary}
          />

          {/* Real Dynamic AI Search Section */}
          <AiSearchSection
            mediaList={mediaList}
            onSelectMedia={(item) => setSelectedMedia(item)}
          />
        </div>

        {/* Right Inspector & Transformation Studio Column */}
        <div className="inspector-column">
          <AiAnalysisPanel
            selectedMedia={selectedMedia}
            onUpdateMedia={(updated) => {
              setSelectedMedia(updated);
              loadMedia();
            }}
          />

          <TransformationStudioPanel selectedMedia={selectedMedia} />
        </div>
      </div>
    </div>
  );
}
