import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Tag,
  FileType,
  Calendar,
  Maximize2,
  RefreshCw,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { analyzeMedia, moderateMedia } from '../../services/api';

export default function AiAnalysisPanel({ selectedMedia, onUpdateMedia }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  if (!selectedMedia) {
    return (
      <div className="panel-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
        <Sparkles size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>No Asset Selected</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Select any asset from the Media Library to inspect its Cloudinary AI tags and moderation status.
        </p>
      </div>
    );
  }

  const rawTags = selectedMedia.tags || [];
  const tagsList = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
    ? rawTags.split(' ').filter(Boolean)
    : [];

  const category = selectedMedia.metadata?.category || selectedMedia.category || 'General';
  const moderationStatus = (selectedMedia.moderationStatus || 'pending').toLowerCase();
  const format = (selectedMedia.format || 'jpg').toUpperCase();
  const dimensions = selectedMedia.width && selectedMedia.height
    ? `${selectedMedia.width} × ${selectedMedia.height} px`
    : 'Auto-detected';

  const formattedDate = selectedMedia.createdAt
    ? new Date(selectedMedia.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const handleReAnalyze = async () => {
    if (!selectedMedia._id) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeMedia(selectedMedia._id);
      if (res && res.media && onUpdateMedia) {
        onUpdateMedia(res.media);
      }
    } catch (err) {
      console.warn('Re-analysis notice:', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleModerate = async () => {
    if (!selectedMedia._id) return;
    setIsModerating(true);
    try {
      const res = await moderateMedia(selectedMedia._id);
      if (res && res.media && onUpdateMedia) {
        onUpdateMedia(res.media);
      }
    } catch (err) {
      console.warn('Moderation notice:', err.message);
    } finally {
      setIsModerating(false);
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>
          <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
          <span>AI Vision Analysis</span>
        </h3>
        <button
          onClick={handleReAnalyze}
          disabled={isAnalyzing}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-indigo)' }}
          title="Re-run Cloudinary Google Auto-Tagging"
        >
          {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          <span>Re-Analyze</span>
        </button>
      </div>

      <div className="analysis-preview-box">
        <img
          src={selectedMedia.secureUrl}
          alt={selectedMedia.originalFilename || 'Media Preview'}
        />
      </div>

      <div className="auto-tags-section">
        <h4>
          <span>Cloudinary AI Tags</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {tagsList.length} tags
          </span>
        </h4>

        {tagsList.length === 0 ? (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            No tags detected yet. Click Re-Analyze to trigger AI vision tagging.
          </p>
        ) : (
          <div className="auto-tags-cloud">
            {tagsList.slice(0, 12).map((t, idx) => (
              <span key={idx} className="auto-tag-item">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="metadata-table">
        <div className="meta-row">
          <div className="meta-row-label">
            <ShieldCheck size={14} />
            <span>Content Moderation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className="meta-badge-approved"
              style={{
                color: moderationStatus === 'approved' ? '#10B981' : moderationStatus === 'rejected' ? '#F43F5E' : '#F59E0B',
                background: moderationStatus === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderColor: moderationStatus === 'approved' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              }}
            >
              {moderationStatus === 'approved' ? <ShieldCheck size={11} /> : <AlertTriangle size={11} />}
              <span style={{ textTransform: 'capitalize' }}>{moderationStatus}</span>
            </span>

            {moderationStatus !== 'approved' && (
              <button
                onClick={handleModerate}
                disabled={isModerating}
                style={{ fontSize: '10px', color: 'var(--accent-indigo)' }}
                title="Verify safety status"
              >
                {isModerating ? <Loader2 size={10} className="animate-spin" /> : 'Check'}
              </button>
            )}
          </div>
        </div>

        <div className="meta-row">
          <div className="meta-row-label">
            <Tag size={14} />
            <span>Category</span>
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {category}
          </span>
        </div>

        <div className="meta-row">
          <div className="meta-row-label">
            <Maximize2 size={14} />
            <span>Dimensions</span>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            {dimensions}
          </span>
        </div>

        <div className="meta-row">
          <div className="meta-row-label">
            <FileType size={14} />
            <span>Format</span>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            {format}
          </span>
        </div>

        <div className="meta-row">
          <div className="meta-row-label">
            <Calendar size={14} />
            <span>Ingested</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
