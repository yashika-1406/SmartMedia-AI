import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Video, X, AlertCircle } from 'lucide-react';

/**
 * UploadBox Component
 * Supports drag-and-drop, native file picker, preview display, and validation for images & videos.
 */
export default function UploadBox({
  selectedFile,
  previewUrl,
  onFileSelected,
  onClearFile,
  isUploading = false,
  uploadProgress = 0,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

const IMAGE_MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100 MB

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

  const handleValidateAndSelect = (file) => {
    setValidationError('');
    if (!file) return;

    const fileType = (file.type || '').toLowerCase();
    const isImage = fileType.startsWith('image/') || ACCEPTED_IMAGE_TYPES.includes(fileType);
    const isVideo = fileType.startsWith('video/') || ACCEPTED_VIDEO_TYPES.includes(fileType);

    if (!isImage && !isVideo) {
      setValidationError(
        'Please select a valid image (JPEG, PNG, WebP, GIF, SVG) or video (MP4, WebM, MOV).'
      );
      return;
    }

    // 15MB limit for images
    if (isImage && file.size > IMAGE_MAX_SIZE) {
      setValidationError('Image exceeds 15 MB limit.');
      return;
    }

    // 100MB limit for videos
    if (isVideo && file.size > VIDEO_MAX_SIZE) {
      setValidationError('Video exceeds 100 MB limit.');
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleValidateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClickBox = () => {
    if (!isUploading && !selectedFile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleValidateAndSelect(e.target.files[0]);
    }
    // Reset file input value so selecting the same file again works
    e.target.value = '';
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearFile();
  };

  const isSelectedVideo =
    selectedFile &&
    (selectedFile.type?.startsWith('video/') ||
      ['video/mp4', 'video/quicktime', 'video/webm'].includes(selectedFile.type));

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={isUploading}
      />

      {/* Validation alert */}
      {validationError && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} />
          <span>{validationError}</span>
        </div>
      )}

      {!selectedFile ? (
        // Dropzone state
        <div
          onClick={handleClickBox}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--accent, #6366f1)' : 'var(--border, #cbd5e1)'}`,
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: isDragOver
              ? 'var(--accent-bg, rgba(99, 102, 241, 0.08))'
              : 'var(--code-bg, #f8fafc)',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            boxShadow: isDragOver ? '0 8px 24px rgba(99, 102, 241, 0.15)' : 'none',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-bg, rgba(99, 102, 241, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--accent, #6366f1)',
            }}
          >
            <UploadCloud size={32} />
          </div>

          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
            Drag and drop an image or video here
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
            or click to browse from your device
          </p>

          <div
            style={{
              display: 'inline-flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[
              'JPEG',
              'PNG',
              'WEBP',
              'MP4',
              'MOV',
              'WEBM',
              'Images ≤ 15MB',
              'Videos ≤ 100MB',
            ].map((badge) => (
              <span
                key={badge}
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#64748b',
                  backgroundColor: 'var(--bg, #ffffff)',
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      ) : (
        // Preview State
        <div
          style={{
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '16px',
            backgroundColor: 'var(--code-bg, #f8fafc)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSelectedVideo ? (
                <Video size={18} style={{ color: 'var(--accent, #6366f1)' }} />
              ) : (
                <ImageIcon size={18} style={{ color: 'var(--accent, #6366f1)' }} />
              )}
              <span style={{ fontWeight: '600', fontSize: '15px' }}>
                {isSelectedVideo ? 'Selected Video Preview' : 'Selected Image Preview'}
              </span>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={handleClear}
                title="Remove selection"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                <X size={16} />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Media Preview Box */}
          <div
            style={{
              width: '100%',
              height: '280px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.2)',
            }}
          >
            {previewUrl ? (
              isSelectedVideo ? (
                <video
                  src={previewUrl}
                  controls
                  preload="metadata"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              )
            ) : null}
          </div>

          {/* File details */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: '#64748b',
              backgroundColor: 'var(--bg, #ffffff)',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <span
              style={{
                fontWeight: '500',
                maxWidth: '65%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedFile.name}
            </span>
            <span>{formatFileSize(selectedFile.size)}</span>
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: 'var(--accent, #6366f1)',
                }}
              >
                <span>
                  {isSelectedVideo
                    ? `Uploading video (${uploadProgress}%)...`
                    : `Uploading to Cloudinary (${uploadProgress}%)...`}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: '#e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: 'var(--accent, #6366f1)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
