import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { uploadImage } from '../../services/api';

export default function IngestionDropZone({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, GIF, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 15 MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setStatusMessage(`Streaming ${file.name} to Cloudinary...`);

    try {
      const result = await uploadImage(file, (percent) => {
        setUploadProgress(percent);
      });

      setStatusMessage('Upload successful! Asset indexed with AI tags.');
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      setTimeout(() => {
        setIsUploading(false);
        setStatusMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 2000);
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Upload failed. Please check network connection.');
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`ingestion-card ${isDragging ? 'drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
      />

      <div className="drop-area-left">
        <div className="upload-icon-circle">
          {isUploading ? (
            <Loader2 size={26} className="animate-spin" />
          ) : (
            <UploadCloud size={26} />
          )}
        </div>

        <h4>
          {isUploading
            ? `Streaming to Cloudinary (${uploadProgress}%)`
            : 'Drag & drop image here to upload'}
        </h4>

        <p>Direct in-memory buffer streaming — zero local disk accumulation</p>

        {isUploading ? (
          <div style={{ width: '240px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: 'var(--grad-primary)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        ) : (
          <button
            className="btn-choose-files"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Image File
          </button>
        )}

        {statusMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '11px', marginTop: '8px' }}>
            <CheckCircle2 size={13} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F43F5E', fontSize: '11px', marginTop: '8px' }}>
            <AlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="format-specs-right">
        <div className="format-spec-row">
          <div className="format-icon-pill" style={{ color: '#38BDF8' }}>
            <ImageIcon size={15} />
          </div>
          <div className="format-meta">
            <h5>Formats</h5>
            <p>JPEG, PNG, WebP, GIF, SVG</p>
          </div>
        </div>

        <div className="format-spec-row">
          <div className="format-icon-pill" style={{ color: '#818CF8' }}>
            <Zap size={15} />
          </div>
          <div className="format-meta">
            <h5>Max File Size</h5>
            <p>15 MB per image</p>
          </div>
        </div>

        <div className="format-spec-row">
          <div className="format-icon-pill" style={{ color: '#C084FC' }}>
            <Cpu size={15} />
          </div>
          <div className="format-meta">
            <h5>AI Auto-Tagging</h5>
            <p>Computer Vision extraction</p>
          </div>
        </div>

        <div className="format-spec-row">
          <div className="format-icon-pill" style={{ color: '#10B981' }}>
            <ShieldCheck size={15} />
          </div>
          <div className="format-meta">
            <h5>Moderation</h5>
            <p>Automated safety screening</p>
          </div>
        </div>
      </div>
    </div>
  );
}
