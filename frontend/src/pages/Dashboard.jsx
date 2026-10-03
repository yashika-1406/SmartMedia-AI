import React from 'react';
import {
  UploadCloud,
  Film,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/common/Button';

/**
 * Dashboard Page
 * High-level overview of media pipeline and quick actions.
 */
export default function Dashboard({ onNavigateToUpload, onNavigateToLibrary }) {
  const metrics = [
    { label: 'Pipeline Status', value: 'Phase 3 Active', sub: 'Media Library Ready', icon: Zap, color: '#10b981' },
    { label: 'Cloudinary CDN', value: 'Connected', sub: 'Direct URL Delivery', icon: Sparkles, color: '#6366f1' },
    { label: 'Database Registry', value: 'MongoDB Atlas', sub: 'Asset Metadata Store', icon: Layers, color: '#0ea5e9' },
    { label: 'Moderation & AI', value: 'Phased', sub: 'Scheduled Phases 4 & 7', icon: ShieldCheck, color: '#f59e0b' },
  ];

  const pipelineStages = [
    { step: '01', title: 'Media Ingestion', desc: 'Multer memory stream to Cloudinary folder', status: 'Implemented' },
    { step: '02', title: 'Metadata Registry', desc: 'MongoDB asset schema & persistence', status: 'Implemented' },
    { step: '03', title: 'Media Library UI', desc: 'Browsing, filtering & metadata inspection', status: 'Implemented' },
    { step: '04', title: 'AI Auto-Tagging', desc: 'Cloudinary Google/AWS tagging models', status: 'Phase 4' },
    { step: '05', title: 'Smart Transformations', desc: 'Content-aware crop & bg-removal', status: 'Phases 8-10' },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto', textAlign: 'left' }}>
      {/* Header with Quick Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 6px 0' }}>
            Pipeline Dashboard
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            SmartMedia AI intelligent media ingestion, analysis, and optimization platform.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToLibrary && (
            <Button
              variant="secondary"
              onClick={onNavigateToLibrary}
              icon={Film}
            >
              Media Library
            </Button>
          )}
          {onNavigateToUpload && (
            <Button
              variant="primary"
              onClick={onNavigateToUpload}
              icon={UploadCloud}
            >
              Upload Media
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              style={{
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: 'var(--code-bg, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: `${m.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.color,
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '2px' }}>{m.value}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Library Feature Banner */}
      <div
        style={{
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '16px',
          backgroundColor: 'var(--code-bg, #f8fafc)',
          padding: '32px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '12px',
            }}
          >
            <Zap size={14} />
            <span>Phase 3 Implemented</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>
            Intelligent Media Library & Asset Inspector
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
            Browse your uploaded media directly from MongoDB Atlas records. Inspect Cloudinary asset dimensions, formats, storage sizes, and CDN URLs with instant client-side filtering and sorting.
          </p>
        </div>

        {onNavigateToLibrary && (
          <Button
            variant="primary"
            onClick={onNavigateToLibrary}
            icon={ArrowRight}
            style={{ padding: '12px 20px' }}
          >
            Open Media Library
          </Button>
        )}
      </div>

      {/* Pipeline Roadmap */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Media Intelligence Pipeline Stages
        </h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {pipelineStages.map((stage) => (
            <div
              key={stage.step}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border, #e2e8f0)',
                backgroundColor: 'var(--bg, #ffffff)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: stage.status === 'Implemented' ? '#10b981' : '#94a3b8',
                    backgroundColor: stage.status === 'Implemented' ? '#ecfdf5' : '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {stage.step}
                </span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{stage.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{stage.desc}</div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: stage.status === 'Implemented' ? '#059669' : '#64748b',
                  backgroundColor: stage.status === 'Implemented' ? '#d1fae5' : '#f8fafc',
                  padding: '4px 10px',
                  borderRadius: '12px',
                }}
              >
                {stage.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
