import React from 'react';
import { Images, ChevronRight, Play, Image as ImageIcon } from 'lucide-react';

export default function MediaLibrarySection({ mediaList, selectedMedia, onSelectMedia, onViewAll }) {
  // Curated fallback assets matching mockup style if library is empty
  const defaultAssets = [
    {
      _id: 'sample-1',
      secureUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      resourceType: 'image',
      format: 'jpg',
      tags: ['lake', 'mountain', 'nature'],
    },
    {
      _id: 'sample-2',
      secureUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
      resourceType: 'image',
      format: 'jpg',
      tags: ['dog', 'glasses', 'pet', 'animal'],
      category: 'Animals / Pets',
      moderationStatus: 'approved',
    },
    {
      _id: 'sample-3',
      secureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      resourceType: 'video',
      duration: '0:28',
      format: 'mp4',
      tags: ['person', 'portrait', 'woman'],
    },
    {
      _id: 'sample-4',
      secureUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      resourceType: 'image',
      format: 'jpg',
      tags: ['food', 'healthy', 'dish', 'salad'],
      category: 'Food',
    },
    {
      _id: 'sample-5',
      secureUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80',
      resourceType: 'video',
      duration: '1:24',
      format: 'mp4',
      tags: ['city', 'traffic', 'night', 'urban'],
    },
    {
      _id: 'sample-6',
      secureUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
      resourceType: 'image',
      format: 'png',
      tags: ['plant', 'interior', 'leaf'],
    },
    {
      _id: 'sample-7',
      secureUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=400&q=80',
      resourceType: 'video',
      duration: '0:32',
      format: 'mp4',
      tags: ['surfing', 'ocean', 'wave'],
    },
    {
      _id: 'sample-8',
      secureUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
      resourceType: 'image',
      format: 'jpg',
      tags: ['architecture', 'building', 'modern'],
    },
    {
      _id: 'sample-9',
      secureUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
      resourceType: 'video',
      duration: '2:18',
      format: 'mp4',
      tags: ['concert', 'crowd', 'stage', 'lights'],
    },
    {
      _id: 'sample-10',
      secureUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      resourceType: 'image',
      format: 'jpg',
      tags: ['laptop', 'desk', 'workspace', 'technology'],
    },
    {
      _id: 'sample-11',
      secureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      resourceType: 'video',
      duration: '0:45',
      format: 'mp4',
      tags: ['portrait', 'glasses', 'man'],
    },
    {
      _id: 'sample-12',
      secureUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
      resourceType: 'image',
      format: 'jpg',
      tags: ['mountain', 'landscape', 'forest'],
    },
  ];

  const itemsToDisplay = mediaList && mediaList.length > 0 ? mediaList : defaultAssets;

  return (
    <section>
      <div className="section-header">
        <div className="section-title-wrap">
          <h3>
            <Images size={17} style={{ color: 'var(--accent-purple)' }} />
            <span>Media Library</span>
          </h3>
          <span className="asset-count-badge">
            {mediaList && mediaList.length > 0 ? `${mediaList.length} assets` : '1,248 assets'}
          </span>
        </div>

        <div className="section-actions">
          <select className="select-sort" aria-label="Sort Media">
            <option>Sort by: Recent</option>
            <option>Sort by: Size</option>
            <option>Sort by: Tags</option>
          </select>
          <button className="btn-view-all" onClick={onViewAll}>
            <span>View All</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="media-grid">
        {itemsToDisplay.map((item) => {
          const isSelected = selectedMedia?._id === item._id;
          const isVideo = item.resourceType === 'video';

          return (
            <div
              key={item._id}
              className={`library-item-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectMedia(item)}
            >
              <img src={item.secureUrl} alt={item.tags?.[0] || 'Media Item'} loading="lazy" />

              {isVideo ? (
                <div className="card-duration-badge">
                  <Play size={10} fill="white" />
                  <span>{item.duration || '0:30'}</span>
                </div>
              ) : (
                <div className="card-type-badge">
                  <ImageIcon size={11} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
