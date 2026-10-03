import React, { useState } from 'react';
import {
  Crop,
  Gauge,
  Eraser,
  Wand2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Columns
} from 'lucide-react';
import { getSmartCrop, removeBackground, transformMedia } from '../../services/api';

export default function TransformationStudioPanel({ selectedMedia }) {
  const [activeTab, setActiveTab] = useState('crop');
  const [selectedPreset, setSelectedPreset] = useState('landscape');
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedResult, setTransformedResult] = useState(null);
  const [centerCropUrl, setCenterCropUrl] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const presets = [
    { id: 'square', ratio: '1:1', label: 'Square (800x800)', desc: 'Avatar & Social Feed' },
    { id: 'portrait', ratio: '4:5', label: 'Portrait (800x1000)', desc: 'Editorial Post' },
    { id: 'story', ratio: '9:16', label: 'Story (720x1280)', desc: 'Mobile Story' },
    { id: 'landscape', ratio: '16:9', label: 'Landscape (1280x720)', desc: 'Desktop Header' },
    { id: 'thumbnail', ratio: '1:1', label: 'Thumbnail (400x400)', desc: 'Compact Preview' },
  ];

  if (!selectedMedia) {
    return (
      <div className="panel-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
        <Crop size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>No Asset Selected</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Select an image from the Media Library to generate AI Smart Crops or remove backgrounds.
        </p>
      </div>
    );
  }

  const handleApplyTransformation = async () => {
    setIsTransforming(true);
    setTransformedResult(null);
    setCenterCropUrl(null);
    setErrorNotice(null);

    try {
      if (activeTab === 'crop') {
        const res = await getSmartCrop(selectedMedia._id, selectedPreset);
        setTransformedResult(res.url);
        setCenterCropUrl(res.centerCropUrl);
      } else if (activeTab === 'bg') {
        const res = await removeBackground(selectedMedia._id);
        setTransformedResult(res.backgroundRemovedUrl);
      } else {
        const res = await transformMedia(selectedMedia._id, {
          preset: selectedPreset,
          removeBackground: false,
        });
        setTransformedResult(res.transformedUrl);
      }
    } catch (err) {
      console.warn('Transformation error:', err.message);
      setErrorNotice(err.message || 'Transformation failed');
    } finally {
      setIsTransforming(false);
    }
  };

  const copyToClipboard = () => {
    if (!transformedResult) return;
    navigator.clipboard.writeText(transformedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayedImage = showComparison && centerCropUrl
    ? centerCropUrl
    : transformedResult || selectedMedia.secureUrl;

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>
          <Wand2 size={16} style={{ color: 'var(--accent-purple)' }} />
          <span>Transformation Studio</span>
        </h3>
      </div>

      {/* 3 Real Supported Action Modes */}
      <div className="transform-tabs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <button
          onClick={() => { setActiveTab('crop'); setTransformedResult(null); }}
          className={`transform-tab-btn ${activeTab === 'crop' ? 'active' : ''}`}
        >
          <Crop size={16} />
          <span>Smart Crop</span>
        </button>

        <button
          onClick={() => { setActiveTab('bg'); setTransformedResult(null); }}
          className={`transform-tab-btn ${activeTab === 'bg' ? 'active' : ''}`}
        >
          <Eraser size={16} />
          <span>Remove BG</span>
        </button>

        <button
          onClick={() => { setActiveTab('optimize'); setTransformedResult(null); }}
          className={`transform-tab-btn ${activeTab === 'optimize' ? 'active' : ''}`}
        >
          <Gauge size={16} />
          <span>Optimize</span>
        </button>
      </div>

      {/* Live Preview Display */}
      <div className="crop-canvas-box">
        <img
          src={displayedImage}
          alt="Transformation Result"
        />

        {showComparison && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', color: '#F8FAFC' }}>
            Viewing: Standard Center Crop (g_center)
          </div>
        )}
      </div>

      {/* Real Aspect Ratio Presets (for Crop & Optimize modes) */}
      {activeTab !== 'bg' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aspect Ratio Presets:</span>
          <div className="aspect-ratios-row">
            {presets.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedPreset(item.id)}
                className={`aspect-pill-btn ${selectedPreset === item.id ? 'active' : ''}`}
                title={item.desc}
              >
                <span className="ratio-num">{item.ratio}</span>
                <span>{item.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compare button if crop returned center comparison */}
      {centerCropUrl && (
        <button
          onClick={() => setShowComparison(!showComparison)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-indigo)', padding: '6px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '6px' }}
        >
          <Columns size={13} />
          <span>{showComparison ? 'Switch to AI Smart Crop (g_auto)' : 'Compare with Center Crop (g_center)'}</span>
        </button>
      )}

      <button
        className="btn-apply-transform"
        onClick={handleApplyTransformation}
        disabled={isTransforming}
      >
        {isTransforming ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Processing with Cloudinary...</span>
          </>
        ) : (
          <>
            <Wand2 size={16} />
            <span>
              {activeTab === 'crop'
                ? `Generate ${selectedPreset.toUpperCase()} Smart Crop`
                : activeTab === 'bg'
                ? 'Remove Background (AI)'
                : 'Apply Web Optimization'}
            </span>
          </>
        )}
      </button>

      {errorNotice && (
        <div style={{ fontSize: '11px', color: '#F43F5E', background: 'rgba(244, 63, 94, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
          {errorNotice}
        </div>
      )}

      {transformedResult && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px' }}>
          <span style={{ color: '#10B981', fontWeight: 600 }}>Delivery URL generated</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <a href={transformedResult} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-indigo)', textDecoration: 'none' }}>
              <ExternalLink size={12} />
              <span>Open</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
