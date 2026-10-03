import React, { useState } from 'react';
import { Sparkles, Sliders, Zap, UploadCloud, Play } from 'lucide-react';

export default function HeroBanner({ onUploadClick }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      className="hero-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
      }}
    >
      <div className="hero-glow-layer"></div>

      <div className="hero-content">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>WELCOME TO SMARTMEDIA AI</span>
        </div>

        <h1 className="hero-title">
          Upload once. Let AI understand, organize, <span>transform, and optimize</span> your media automatically.
        </h1>

        <div className="hero-features">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>AI-Powered Organization</span>
          </div>
          <div className="hero-pill">
            <Sliders size={14} />
            <span>Smart Transformations</span>
          </div>
          <div className="hero-pill">
            <Zap size={14} />
            <span>Optimized Delivery</span>
          </div>
        </div>

        <div className="hero-cta">
          <button className="btn-hero-upload" onClick={onUploadClick}>
            <UploadCloud size={18} />
            <span>Upload Media</span>
          </button>
          <span className="hero-cta-subtext">Images, videos, audio and more</span>
        </div>
      </div>

      <div className="hero-visual-container">
        {/* Layer 1: Background Lake Landscape */}
        <div className="floating-glass-card card-layer-back animate-float">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
            alt="Landscape Preview"
          />
        </div>

        {/* Layer 2: Foreground Sunny Mountain Preview with play icon */}
        <div className="floating-glass-card card-layer-main">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=80"
            alt="AI Mountain Video Stream"
          />
          <div className="hero-play-badge">
            <Play size={16} fill="white" />
          </div>
        </div>
      </div>
    </div>
  );
}
