import React from 'react';
import { Images, ChevronRight, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function MediaLibrarySection({ mediaList = [], selectedMedia, onSelectMedia, onDeleteMedia, onViewAll }) {
  const formatBytes = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <section>
      <div className="section-header">
        <div className="section-title-wrap">
          <h3>
            <Images size={17} style={{ color: 'var(--accent-purple)' }} />
            <span>Media Library</span>
          </h3>
          <span className="asset-count-badge">
            {mediaList.length} {mediaList.length === 1 ? 'asset' : 'assets'}
          </span>
        </div>

        <div className="section-actions">
          <button className="btn-view-all" onClick={onViewAll}>
            <span>View All</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {mediaList.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <ImageIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
          <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>No media uploaded yet</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload an image above to see it appear in your Cloudinary gallery.</p>
        </div>
      ) : (
        <div className="media-grid">
          {mediaList.map((item) => {
            const isSelected = selectedMedia?._id === item._id;
            const format = (item.format || 'jpg').toUpperCase();

            return (
              <div
                key={item._id}
                className={`library-item-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectMedia(item)}
                style={{ position: 'relative' }}
              >
                <img
                  src={item.secureUrl}
                  alt={item.originalFilename || item.publicId || 'Cloudinary Media'}
                  loading="lazy"
                />

                <div className="card-type-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700 }}>
                  <span>{format}</span>
                  {item.bytes && (
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                      • {formatBytes(item.bytes)}
                    </span>
                  )}
                </div>

                {onDeleteMedia && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this asset from Cloudinary and MongoDB?')) {
                        onDeleteMedia(item._id);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: '4px',
                      padding: '4px',
                      color: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Delete Asset"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
