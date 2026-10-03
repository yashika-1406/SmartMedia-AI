import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Database,
  Calendar,
  Film,
} from 'lucide-react';
import UploadBox from '../components/media/UploadBox';
import Button from '../components/common/Button';
import { uploadImage } from '../services/api';

/**
 * Upload Page - Phase 2 & 3: Cloudinary Upload + MongoDB Persistence
 */
export default function Upload({ onNavigateToLibrary }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (isUploading || !selectedFile) {
      if (!selectedFile) {
        setErrorMessage('Please select an image file first.');
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await uploadImage(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      const mediaData = response.media || response.data || response;
      setUploadedMedia(mediaData);
      setSuccessMessage('Image uploaded to Cloudinary & saved to MongoDB Atlas!');
      // Clean up local preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (err) {
      const errorDetail =
        err.response?.data?.message ||
        err.message ||
        'Failed to upload image. Please verify backend server, Cloudinary credentials, and MongoDB connection.';
      setErrorMessage(errorDetail);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAnother = () => {
    setUploadedMedia(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(0);
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const displayPublicId = uploadedMedia?.publicId || uploadedMedia?.public_id;
  const displaySecureUrl = uploadedMedia?.secureUrl || uploadedMedia?.secure_url;
  const displayResourceType = uploadedMedia?.resourceType || uploadedMedia?.resource_type;
  const displayCreatedAt = uploadedMedia?.createdAt || uploadedMedia?.created_at;

  return (
    <div style={{ padding: '28px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <header style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-bg, rgba(99, 102, 241, 0.12))',
              color: 'var(--accent, #6366f1)',
              display: 'flex',
            }}
          >
            <UploadCloud size={24} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0 }}>Media Ingestion Pipeline</h1>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
          Upload high-resolution images to Cloudinary with metadata persistence in MongoDB Atlas.
        </p>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Upload Error</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
          }}
        >
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: '500' }}>{successMessage}</span>
        </div>
      )}

      {/* Conditional Rendering: Upload Mode vs Result Mode */}
      {!uploadedMedia ? (
        <div>
          <UploadBox
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileSelected={handleFileSelect}
            onClearFile={handleClearFile}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />

          {/* Action Row */}
          {selectedFile && (
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <Button
                variant="secondary"
                onClick={handleClearFile}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={isUploading}
                icon={isUploading ? null : Sparkles}
              >
                {isUploading ? `Uploading (${uploadProgress}%)` : 'Upload to Cloudinary'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Uploaded Result View */
        <div
          style={{
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '16px',
            backgroundColor: 'var(--code-bg, #f8fafc)',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              paddingBottom: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
              <CheckCircle2 size={20} />
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                Asset Ingested & Persisted
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                onClick={handleUploadAnother}
                icon={RotateCcw}
                style={{ fontSize: '13px', padding: '8px 14px' }}
              >
                Upload Another
              </Button>

              {onNavigateToLibrary && (
                <Button
                  variant="primary"
                  onClick={onNavigateToLibrary}
                  icon={Film}
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                >
                  View in Library
                </Button>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
              alignItems: 'start',
            }}
          >
            {/* Left: Cloudinary Hosted Image */}
            <div>
              <div
                style={{
                  width: '100%',
                  minHeight: '320px',
                  maxHeight: '440px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                {displaySecureUrl && (
                  <img
                    src={displaySecureUrl}
                    alt={displayPublicId || 'Uploaded asset'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '440px',
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>

              {displaySecureUrl && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <a
                    href={displaySecureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: 'var(--accent, #6366f1)',
                      textDecoration: 'none',
                      fontWeight: '500',
                    }}
                  >
                    <span>Open CDN URL in new tab</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Right: Returned Cloudinary & MongoDB Metadata */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                Asset & Database Record
              </h3>

              {/* MongoDB Record ID (Phase 2) */}
              {uploadedMedia._id && (
                <div
                  style={{
                    backgroundColor: 'var(--bg, #ffffff)',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid #c7d2fe',
                    boxShadow: '0 1px 3px rgba(99, 102, 241, 0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#4f46e5',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '600',
                    }}
                  >
                    <Database size={13} />
                    <span>MongoDB Document ID</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <code style={{ fontSize: '13px', color: '#312e81', fontWeight: '600', wordBreak: 'break-all' }}>
                      {uploadedMedia._id}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(uploadedMedia._id, 'mongo_id')}
                      title="Copy MongoDB ID"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: copiedField === 'mongo_id' ? '#16a34a' : '#64748b',
                        padding: '4px',
                      }}
                    >
                      {copiedField === 'mongo_id' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Public ID */}
              <div
                style={{
                  backgroundColor: 'var(--bg, #ffffff)',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border, #e2e8f0)',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cloudinary Public ID
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <code style={{ fontSize: '13px', wordBreak: 'break-all' }}>
                    {displayPublicId}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(displayPublicId, 'public_id')}
                    title="Copy Public ID"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: copiedField === 'public_id' ? '#16a34a' : '#64748b',
                      padding: '4px',
                    }}
                  >
                    {copiedField === 'public_id' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Grid attributes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
              >
                {/* Dimensions */}
                <div
                  style={{
                    backgroundColor: 'var(--bg, #ffffff)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #e2e8f0)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Dimensions
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '2px' }}>
                    {uploadedMedia.width} × {uploadedMedia.height}
                  </div>
                </div>

                {/* Format */}
                <div
                  style={{
                    backgroundColor: 'var(--bg, #ffffff)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #e2e8f0)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Format
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginTop: '2px',
                      textTransform: 'uppercase',
                      color: 'var(--accent, #6366f1)',
                    }}
                  >
                    {uploadedMedia.format}
                  </div>
                </div>

                {/* Resource Type */}
                <div
                  style={{
                    backgroundColor: 'var(--bg, #ffffff)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #e2e8f0)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Resource Type
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '2px', textTransform: 'capitalize' }}>
                    {displayResourceType}
                  </div>
                </div>

                {/* File Size */}
                <div
                  style={{
                    backgroundColor: 'var(--bg, #ffffff)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #e2e8f0)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    File Size
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '2px' }}>
                    {formatBytes(uploadedMedia.bytes)}
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              {displayCreatedAt && (
                <div
                  style={{
                    backgroundColor: 'var(--bg, #ffffff)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #e2e8f0)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  <Calendar size={15} style={{ color: 'var(--accent, #6366f1)' }} />
                  <span>Uploaded: {formatDate(displayCreatedAt)}</span>
                </div>
              )}

              {/* Secure URL */}
              <div
                style={{
                  backgroundColor: 'var(--bg, #ffffff)',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border, #e2e8f0)',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Secure Delivery URL
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#475569',
                      wordBreak: 'break-all',
                      fontFamily: 'var(--mono, monospace)',
                    }}
                  >
                    {displaySecureUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(displaySecureUrl, 'secure_url')}
                    title="Copy Secure URL"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: copiedField === 'secure_url' ? '#16a34a' : '#64748b',
                      padding: '4px',
                      flexShrink: 0,
                    }}
                  >
                    {copiedField === 'secure_url' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
