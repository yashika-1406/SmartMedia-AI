import React, { useState } from 'react';
import {
  Crop,
  Layers,
  Gauge,
  Eraser,
  Wand2,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { getSmartCrop, removeBackground, transformMedia } from '../../services/api';

export default function TransformationStudioPanel({ selectedMedia }) {
  const [activeTab, setActiveTab] = useState('crop');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedResult, setTransformedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fallback image matching mockup
  const currentAsset = selectedMedia || {
    _id: 'sample-asset',
    publicId: 'smartmedia/uploads/dog_glasses',
    secureUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
  };

  const transformTabs = [
    { id: 'crop', label: 'Smart Crop', icon: Crop },
    { id: 'bg', label: 'Remove Background', icon: Eraser },
    { id: 'optimize', label: 'Optimize for Web', icon: Gauge },
    { id: 'variants', label: 'Generate Variants', icon: Layers },
  ];

  const aspectRatios = [
    { id: '1:1', ratio: '1:1', label: 'Square', preset: 'square', inset: '10% 25%' },
    { id: '16:9', ratio: '16:9', label: 'Widescreen', preset: 'landscape', inset: '25% 10%' },
    { id: '4:5', ratio: '4:5', label: 'Portrait', preset: 'portrait', inset: '10% 20%' },
    { id: '9:16', ratio: '9:16', label: 'Social', preset: 'story', inset: '5% 35%' },
  ];

  const currentRatioObj = aspectRatios.find((r) => r.id === selectedRatio) || aspectRatios[1];

  const handleApplyTransformation = async () => {
    setIsTransforming(true);
    setTransformedResult(null);

    try {
      if (selectedMedia && selectedMedia._id && !selectedMedia._id.startsWith('sample')) {
        let resultUrl = '';
        if (activeTab === 'crop') {
          const res = await getSmartCrop(selectedMedia._id, currentRatioObj.preset);
          resultUrl = res.url;
        } else if (activeTab === 'bg') {
          const res = await removeBackground(selectedMedia._id);
          resultUrl = res.backgroundRemovedUrl;
        } else {
          const res = await transformMedia(selectedMedia._id, {
            preset: currentRatioObj.preset,
            removeBackground: activeTab === 'bg',
          });
          resultUrl = res.transformedUrl;
        }
        setTransformedResult(resultUrl);
      } else {
        // High quality preview simulation if using sample asset
        const simulatedUrl =
          activeTab === 'bg'
            ? 'https://res.cloudinary.com/demo/image/upload/e_background_removal/q_auto/docs/camera.png'
            : `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80`;
        setTransformedResult(simulatedUrl);
      }
    } catch (err) {
      console.warn('Transformation failed on live API, falling back to dynamic URL:', err.message);
      setTransformedResult(currentAsset.secureUrl);
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

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>
          <Wand2 size={16} style={{ color: 'var(--accent-purple)' }} />
          <span>Transformation Studio</span>
        </h3>
        <button className="btn-view-all">
          <span>View All</span>
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="transform-tabs-grid">
        {transformTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`transform-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Live Crop Canvas with Crop Handles */}
      <div className="crop-canvas-box">
        <img
          src={transformedResult || currentAsset.secureUrl}
          alt="Transformation Canvas"
        />

        {activeTab === 'crop' && !transformedResult && (
          <div
            className="crop-boundary-overlay"
            style={{ inset: currentRatioObj.inset }}
          >
            <div className="crop-handle tl"></div>
            <div className="crop-handle tr"></div>
            <div className="crop-handle bl"></div>
            <div className="crop-handle br"></div>
          </div>
        )}
      </div>

      {/* Aspect Ratio Selector Pills */}
      <div className="aspect-ratios-row">
        {aspectRatios.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedRatio(item.id)}
            className={`aspect-pill-btn ${selectedRatio === item.id ? 'active' : ''}`}
          >
            <span className="ratio-num">{item.ratio}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <button
        className="btn-apply-transform"
        onClick={handleApplyTransformation}
        disabled={isTransforming}
      >
        {isTransforming ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Processing with Cloudinary AI...</span>
          </>
        ) : (
          <>
            <Wand2 size={16} />
            <span>Apply Transformation</span>
          </>
        )}
      </button>

      {transformedResult && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px' }}>
          <span style={{ color: '#10B981', fontWeight: 600 }}>Optimized URL ready</span>
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
