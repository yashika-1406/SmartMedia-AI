import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle
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
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setStatusMessage(`Streaming ${file.name} to Cloudinary...`);

    try {
      const result = await uploadImage(file, (percent) => {
        setUploadProgress(percent);
      });

      setStatusMessage(`Upload completed! Media indexed.`);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      setTimeout(() => {
        setIsUploading(false);
        setStatusMessage(null);
      }, 2500);
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Upload failed. Check backend connection.');
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
        accept="image/*,video/*"
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
            ? `Uploading Media (${uploadProgress}%)`
            : 'Drag & drop your media here'}
        </h4>

        <p>Supports images, videos, audio and documents</p>

        {isUploading ? (
          <div style={{ width: '220px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
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
            Choose Files
          </button>
        )}

        {statusMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '11px', marginTop: '6px' }}>
            <CheckCircle2 size={13} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F43F5E', fontSize: '11px', marginTop: '6px' }}>
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
            <h5>Images</h5>
            <p>JPG, PNG, WebP (Max 50MB)</p>
          </div>
        </div>

        <div className="format-spec-row">
          <div className="format-icon-pill" style={{ color: '#818CF8' }}>
            <VideoIcon size={15} />
          </div>
          <div className="format-meta">
            <h5>Videos</h5>
            <p>MP4, MOV, AVI (Max 5GB)</p>
          </div>
        </div>

        <div className="format-spec-row">
          <div className="format-icon-pill" style={{ color: '#C084FC' }}>
            <Music size={15} />
          </div>
          <div className="format-meta">
            <h5>Audio</h5>
            <p>MP3, WAV, M4A (Max 1GB)</p>
          </div>
        </div>

        <div className="format-spec-row">
          <div className="format-icon-pill" style={{ color: '#F472B6' }}>
            <FileText size={15} />
          </div>
          <div className="format-meta">
            <h5>Documents</h5>
            <p>PDF, TXT (Max 100MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
