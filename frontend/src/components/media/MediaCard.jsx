import React, { useState } from 'react';
import { Image as ImageIcon, Film, Play, AlertCircle, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/formatters';
import { getOptimizedUrl, getVideoThumbnailUrl } from '../../utils/cloudinary';

/**
 * MediaCard Component
 * Displays an individual Cloudinary media asset with MongoDB metadata.
 * Renders video thumbnail poster with Play icon overlay and duration for videos.
 */
export default function MediaCard({ media, onSelect }) {
  const [imageError, setImageError] = useState(false);

  if (!media) return null;

  const isVideo = media.resourceType === 'video';
  const displayName = media.originalFilename || media.publicId?.split('/').pop() || 'Untitled Asset';
  const formatText = media.format ? media.format.toUpperCase() : (isVideo ? 'VIDEO' : 'IMG');
  const dimensionsText = media.width && media.height ? `${media.width} × ${media.height}` : null;
  const sizeText = formatBytes(media.bytes);
  const dateText = formatDate(media.createdAt);

  // For videos: generate derived image poster frame; never use original video URL in <img>
  const displayThumbnailUrl = isVideo
    ? getVideoThumbnailUrl(media, { width: 600, crop: 'limit', startOffset: '0' })
    : getOptimizedUrl(media, { width: 600, crop: 'limit' });

  const imageSrc = isVideo ? displayThumbnailUrl : (displayThumbnailUrl || media.secureUrl);

  return (
    <div
      onClick={() => onSelect && onSelect(media)}
      style={{
        border: '1px solid var(--border, #e2e8f0)',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'var(--code-bg, #ffffff)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = 'var(--accent, #6366f1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
      }}
    >
      {/* Media Image / Video Poster Thumbnail Container */}
      <div
        style={{
          width: '100%',
          height: '190px',
          backgroundColor: '#0f172a',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {!imageError && imageSrc ? (
          <img
            src={imageSrc}
            alt={displayName}
            loading="lazy"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.25s ease',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              fontSize: '13px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            {isVideo ? (
              <>
                <Film size={28} style={{ color: 'var(--accent, #6366f1)' }} />
                <span style={{ fontWeight: '500', color: '#cbd5e1' }}>Video Preview</span>
              </>
            ) : imageError ? (
              <>
                <AlertCircle size={24} style={{ color: '#ef4444' }} />
                <span>Preview unavailable</span>
              </>
            ) : (
              <>
                <ImageIcon size={24} />
                <span>No preview</span>
              </>
            )}
          </div>
        )}

        {/* Video Play Icon Overlay (Phase 12) */}
        {isVideo && !imageError && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '2px solid rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <Play size={22} fill="#ffffff" style={{ marginLeft: '3px' }} />
          </div>
        )}

        {/* Video Duration Badge (Phase 12) */}
        {isVideo && typeof media.duration === 'number' && (
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 7px',
              borderRadius: '4px',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.3px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {Math.round(media.duration)} sec
          </span>
        )}

        {/* Moderation Status Badge (Phase 6) */}
        {media.moderationStatus && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor:
                media.moderationStatus === 'approved'
                  ? 'rgba(22, 101, 52, 0.85)'
                  : media.moderationStatus === 'pending'
                  ? 'rgba(180, 83, 9, 0.85)'
                  : media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected'
                  ? 'rgba(153, 27, 27, 0.85)'
                  : 'rgba(51, 65, 85, 0.85)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '6px',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {media.moderationStatus === 'approved' && (
              <>
                <ShieldCheck size={12} />
                <span>Safe</span>
              </>
            )}
            {media.moderationStatus === 'pending' && (
              <>
                <Clock size={12} />
                <span>Pending</span>
              </>
            )}
            {(media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected') && (
              <>
                <ShieldAlert size={12} />
                <span>Flagged</span>
              </>
            )}
            {media.moderationStatus === 'failed' && (
              <>
                <AlertCircle size={12} />
                <span>Failed</span>
              </>
            )}
            {media.moderationStatus === 'unavailable' && (
              <>
                <AlertCircle size={12} />
                <span>Unavailable</span>
              </>
            )}
          </span>
        )}

        {/* Format Badge */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            color: '#f8fafc',
            fontSize: '11px',
            fontWeight: '600',
            padding: '3px 8px',
            borderRadius: '6px',
            backdropFilter: 'blur(4px)',
            letterSpacing: '0.5px',
          }}
        >
          {formatText}
        </span>

        {/* Structured Metadata Category Badge (Phase 7) */}
        {media.metadata?.category && (
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#c7d2fe',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 7px',
              borderRadius: '4px',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.3px',
              border: '1px solid rgba(199, 210, 254, 0.25)',
            }}
          >
            {media.metadata.category}
          </span>
        )}
      </div>

      {/* Media Details */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Filename */}
          <div
            title={displayName}
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-h, #0f172a)',
              marginBottom: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>

          {/* Format & Dimensions line */}
          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{formatText}</span>
            {dimensionsText && (
              <>
                <span>•</span>
                <span>{dimensionsText}</span>
              </>
            )}
            {isVideo && typeof media.duration === 'number' && (
              <>
                <span>•</span>
                <span>{Math.round(media.duration)} sec</span>
              </>
            )}
          </div>

          {/* Tags Preview (up to 3 tags) */}
          {Array.isArray(media.tags) && media.tags.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '6px',
              }}
            >
              {media.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    color: 'var(--accent, #6366f1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    lineHeight: '1.3',
                  }}
                >
                  #{tag}
                </span>
              ))}
              {media.tags.length > 3 && (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    padding: '2px 4px',
                    alignSelf: 'center',
                  }}
                >
                  +{media.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Size and Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8',
            borderTop: '1px solid var(--border, #f1f5f9)',
            paddingTop: '10px',
            marginTop: '8px',
          }}
        >
          <span style={{ fontWeight: '500' }}>{sizeText}</span>
          <span>{dateText}</span>
        </div>
      </div>
    </div>
  );
}
