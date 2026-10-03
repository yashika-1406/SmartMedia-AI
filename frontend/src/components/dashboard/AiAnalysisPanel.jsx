import React from 'react';
import {
  Sparkles,
  ChevronRight,
  Plus,
  ShieldCheck,
  Tag,
  FileType,
  Calendar
} from 'lucide-react';

export default function AiAnalysisPanel({ selectedMedia, onAddTag }) {
  // Mockup reference asset defaults
  const currentAsset = selectedMedia || {
    secureUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
    tags: [
      'person',
      'dog',
      'blazer',
      'glasses',
      'laptop',
      'indoor',
      'office',
      'pet',
      'animal',
      'smiling',
      'workspace',
    ],
    category: 'Animals / Pets',
    contentType: 'Image',
    moderationStatus: 'Approved',
    aiProcessedDate: 'Oct 15, 2024, 10:24 AM',
  };

  const tagsList = Array.isArray(currentAsset.tags)
    ? currentAsset.tags
    : typeof currentAsset.tags === 'string'
    ? currentAsset.tags.split(' ')
    : ['dog', 'glasses', 'laptop', 'office'];

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>
          <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
          <span>AI Analysis</span>
        </h3>
        <button className="btn-view-all">
          <span>View Details</span>
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="analysis-preview-box">
        <img
          src={currentAsset.secureUrl}
          alt="Analysis Preview"
        />
      </div>

      <div className="auto-tags-section">
        <h4>
          <span>Auto Tags</span>
          <button
            className="btn-add-tag"
            onClick={() => {
              const tag = prompt('Add new tag:');
              if (tag && onAddTag) onAddTag(tag);
            }}
          >
            <Plus size={11} />
            <span>Add Tag</span>
          </button>
        </h4>

        <div className="auto-tags-cloud">
          {tagsList.slice(0, 11).map((t, idx) => (
            <span key={idx} className="auto-tag-item">
              {t}
            </span>
          ))}
          {tagsList.length > 11 && (
            <span className="auto-tag-item" style={{ color: 'var(--accent-indigo)' }}>
              +{tagsList.length - 11}
            </span>
          )}
        </div>
      </div>

      <div className="metadata-table">
        <div className="meta-row">
          <div className="meta-row-label">
            <ShieldCheck size={14} />
            <span>Moderation</span>
          </div>
          <span className="meta-badge-approved">
            <ShieldCheck size={11} />
            <span>{currentAsset.moderationStatus || 'Approved'}</span>
          </span>
        </div>

        <div className="meta-row">
          <div className="meta-row-label">
            <Tag size={14} />
            <span>Category</span>
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {currentAsset.category || 'Animals / Pets'}
          </span>
        </div>

        <div className="meta-row">
          <div className="meta-row-label">
            <FileType size={14} />
            <span>Content Type</span>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            {currentAsset.resourceType || 'Image'}
          </span>
        </div>

        <div className="meta-row">
          <div className="meta-row-label">
            <Calendar size={14} />
            <span>AI Processed</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {currentAsset.aiProcessedDate || 'Oct 15, 2024, 10:24 AM'}
          </span>
        </div>
      </div>
    </div>
  );
}
