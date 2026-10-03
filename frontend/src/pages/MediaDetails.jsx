import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Database,
  Calendar,
  Cloud,
  FileText,
  AlertTriangle,
  Sparkles,
  Tag,
  Info,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  RefreshCw,
  Crop,
  Eye,
  Wand2,
  Zap,
  Sliders,
} from 'lucide-react';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import {
  getMediaById,
  analyzeMedia,
  moderateMedia,
  syncMetadata,
  getSmartCrop,
  removeBackground,
  transformMedia,
} from '../services/api';
import { formatBytes, formatDate } from '../utils/formatters';
import { getOptimizedUrl } from '../utils/cloudinary';

const CROP_PRESETS = [
  { id: 'square', label: 'Square', ratio: '1:1', dims: '800 × 800', desc: 'Social & Profile' },
  { id: 'portrait', label: 'Portrait', ratio: '4:5', dims: '800 × 1000', desc: 'Feed Post' },
  { id: 'story', label: 'Story', ratio: '9:16', dims: '720 × 1280', desc: 'Stories & Reels' },
  { id: 'landscape', label: 'Landscape', ratio: '16:9', dims: '1280 × 720', desc: 'Header & Banner' },
  { id: 'thumbnail', label: 'Thumbnail', ratio: '1:1', dims: '400 × 400', desc: 'Avatar / Icon' },
];

/**
 * MediaDetails Page - Phase 3: Inspector, Phase 6: Moderation, Phase 7: Metadata, Phase 8: Smart Crop
 * Loads single asset metadata from GET /api/media/:id
 */
export default function MediaDetails({ mediaId, onBack }) {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(Boolean(mediaId));
  const [error, setError] = useState(mediaId ? '' : 'No media asset selected.');
  const [copiedField, setCopiedField] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState(null);

  // Phase 8: Content-Aware Smart Crop state
  const [activeCropPreset, setActiveCropPreset] = useState('square');
  const [smartCropData, setSmartCropData] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropError, setCropError] = useState(null);
  const [showCenterComparison, setShowCenterComparison] = useState(false);
  const [cropImgError, setCropImgError] = useState(false);

  const handleGenerateCrop = async (presetId) => {
    const targetPreset = presetId || activeCropPreset;
    if (!media?._id) return;

    setIsCropping(true);
    setCropError(null);
    setCropImgError(false);

    try {
      const response = await getSmartCrop(media._id, targetPreset);
      setSmartCropData(response);
      setActiveCropPreset(targetPreset);
    } catch (err) {
      console.warn('[MediaDetails] Smart crop error:', err);
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to generate smart crop. Please try again.';
      setCropError(message);
    } finally {
      setIsCropping(false);
    }
  };

  // Phase 9: AI Background Removal state
  const [bgRemovalData, setBgRemovalData] = useState(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovalError, setBgRemovalError] = useState(null);
  const [bgImgError, setBgImgError] = useState(false);

  const handleRemoveBackground = async () => {
    if (isRemovingBg || !media?._id) return;

    if (media.resourceType && media.resourceType !== 'image') {
      setBgRemovalError('Background removal is not supported for this media.');
      return;
    }

    setIsRemovingBg(true);
    setBgRemovalError(null);
    setBgImgError(false);

    try {
      const response = await removeBackground(media._id);
      setBgRemovalData(response);
    } catch (err) {
      console.warn('[MediaDetails] Background removal error:', err);
      const status = err.response?.status;
      const errMsg = err.response?.data?.message || err.message || '';

      let userMsg = 'Background removal failed. Try again.';
      if (
        status === 420 ||
        errMsg.toLowerCase().includes('not available') ||
        errMsg.toLowerCase().includes('subscription')
      ) {
        userMsg = 'Background removal is not available for this Cloudinary environment.';
      } else if (errMsg.toLowerCase().includes('not supported') || errMsg.toLowerCase().includes('resource')) {
        userMsg = 'Background removal is not supported for this media.';
      } else if (status >= 400 && status < 500) {
        userMsg = errMsg || 'Unable to remove background.';
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        userMsg = 'Background removal failed. Try again.';
      } else {
        userMsg = 'Unable to remove background.';
      }
      setBgRemovalError(userMsg);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Phase 11: Unified Transformation Studio state
  const [selectedStudioPreset, setSelectedStudioPreset] = useState('square');
  const [studioRemoveBg, setStudioRemoveBg] = useState(false);
  const [studioTransformData, setStudioTransformData] = useState(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [studioError, setStudioError] = useState(null);
  const [studioImgError, setStudioImgError] = useState(false);

  const handleGenerateStudioTransform = async (customPreset, customRemoveBg) => {
    if (isTransforming || !media?._id) return;

    if (media.resourceType && media.resourceType !== 'image') {
      setStudioError('Transformation studio is only supported for image assets.');
      return;
    }

    const presetToUse = customPreset !== undefined ? customPreset : selectedStudioPreset;
    const removeBgToUse = customRemoveBg !== undefined ? customRemoveBg : studioRemoveBg;

    setIsTransforming(true);
    setStudioError(null);
    setStudioImgError(false);

    try {
      const response = await transformMedia(media._id, {
        preset: presetToUse,
        removeBackground: removeBgToUse,
      });
      setStudioTransformData(response);
    } catch (err) {
      console.warn('[MediaDetails] Transformation Studio error:', err);
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to generate transformation.';
      setStudioError(message);
    } finally {
      setIsTransforming(false);
    }
  };

  // Phase 6: Moderation state
  const [isModerating, setIsModerating] = useState(false);
  const [moderationNotice, setModerationNotice] = useState(null);

  // Phase 7: Structured Metadata state
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [metadataNotice, setMetadataNotice] = useState(null);

  const handleSyncMetadata = async () => {
    if (isSyncingMeta || !media?._id) return;

    setIsSyncingMeta(true);
    setMetadataNotice(null);

    try {
      const response = await syncMetadata(media._id);
      if (response.media) {
        setMedia(response.media);
      }
      setMetadataNotice({
        type: 'success',
        text: response.message || 'Structured metadata synchronized successfully.',
      });
    } catch (err) {
      console.warn('[MediaDetails] Metadata sync notice/error:', err);
      if (err.response?.data?.media) {
        setMedia(err.response.data.media);
      }
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to synchronize structured metadata with Cloudinary.';
      setMetadataNotice({
        type: 'error',
        text: message,
      });
    } finally {
      setIsSyncingMeta(false);
    }
  };

  const handleModerate = async () => {
    if (isModerating || !media?._id) return;

    setIsModerating(true);
    setModerationNotice(null);

    try {
      const response = await moderateMedia(media._id);
      if (response.media) {
        setMedia(response.media);
      }
      setModerationNotice({
        type: 'success',
        text: response.message || `Content safety check complete: ${response.moderationStatus || 'approved'}.`,
      });
    } catch (err) {
      console.warn('[MediaDetails] Moderation notice/error:', err);
      if (err.response?.data?.media) {
        setMedia(err.response.data.media);
      }
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to execute content safety check.';
      setModerationNotice({
        type: 'error',
        text: message,
      });
    } finally {
      setIsModerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (isAnalyzing || !media?._id) return;

    setIsAnalyzing(true);
    setAnalysisNotice(null);

    try {
      const response = await analyzeMedia(media._id);
      if (response.media) {
        setMedia(response.media);
      }
      setAnalysisNotice({
        type: 'success',
        text: response.message || 'AI analysis complete! Tags updated.',
      });
    } catch (err) {
      console.warn('[MediaDetails] Analysis notice/error:', err);
      if (err.response?.data?.media) {
        setMedia(err.response.data.media);
      }
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to analyze media asset.';
      const isUnavailable =
        err.response?.status === 422 || err.response?.data?.taggingStatus === 'unavailable';
      setAnalysisNotice({
        type: isUnavailable ? 'warning' : 'error',
        text: message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!mediaId) {
      return;
    }

    let isMounted = true;
    const fetchAsset = async () => {
      try {
        const response = await getMediaById(mediaId);
        const asset = response.media || response.data || response;
        if (isMounted) {
          setMedia(asset);
        }
        if (asset?._id) {
          try {
            const cropRes = await getSmartCrop(asset._id, 'square');
            if (isMounted) {
              setSmartCropData(cropRes);
              setActiveCropPreset('square');
            }
          } catch (cropErr) {
            console.warn('[MediaDetails] Initial smart crop warning:', cropErr.message);
          }
        }
      } catch (err) {
        console.error('[MediaDetails Error] Failed to fetch media record:', err);
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Media asset not found or unable to load details.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAsset();

    return () => {
      isMounted = false;
    };
  }, [mediaId]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <Loader size={36} text="Loading asset details..." />
      </div>
    );
  }

  if (error || !media) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <div style={{ marginBottom: '20px' }}>
          <Button variant="secondary" onClick={onBack} icon={ArrowLeft}>
            Back to Library
          </Button>
        </div>

        <div
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
          }}
        >
          <AlertTriangle size={36} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#991b1b', fontWeight: '600' }}>
            Asset Not Found
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#7f1d1d', fontSize: '14px' }}>
            {error || 'Unable to retrieve the requested media record.'}
          </p>
          <Button variant="primary" onClick={onBack}>
            Return to Media Library
          </Button>
        </div>
      </div>
    );
  }

  const displayName = media.originalFilename || media.publicId?.split('/').pop() || 'Untitled Asset';
  const formatText = media.format ? media.format.toUpperCase() : 'UNKNOWN';
  const dimensionsText = media.width && media.height ? `${media.width} × ${media.height} px` : 'N/A';
  const sizeText = formatBytes(media.bytes);
  const createdDate = formatDate(media.createdAt, true);

  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto', textAlign: 'left' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text, #64748b)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Library</span>
        </button>
      </div>

      {/* Main Asset View Container */}
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Full Image Preview */}
          <div>
            <div
              style={{
                width: '100%',
                minHeight: '340px',
                maxHeight: '520px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              }}
            >
              {media.secureUrl ? (
                <img
                  src={getOptimizedUrl(media, { width: 1600, crop: 'limit' })}
                  alt={displayName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '520px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ color: '#94a3b8' }}>Preview not available</div>
              )}
            </div>

            {media.secureUrl && (
              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <a
                  href={media.secureUrl}
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

          {/* Right Column: Asset Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  margin: '0 0 6px 0',
                  color: 'var(--text-h, #0f172a)',
                  wordBreak: 'break-word',
                }}
              >
                {displayName}
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#64748b',
                }}
              >
                <Calendar size={14} />
                <span>Uploaded {createdDate}</span>
              </div>
            </div>

            {/* Basic Information Section */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  margin: '0 0 14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={15} />
                <span>Basic Information</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Format</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--accent, #6366f1)', marginTop: '2px' }}>
                    {formatText}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Resource Type</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', textTransform: 'capitalize', marginTop: '2px' }}>
                    {media.resourceType || 'image'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Dimensions</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '2px' }}>
                    {dimensionsText}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>File Size</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '2px' }}>
                    {sizeText}
                  </div>
                </div>
              </div>
            </div>

            {/* Cloudinary AI Auto-Tags Section */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid #c7d2fe',
                borderRadius: '12px',
                padding: '18px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#4f46e5',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Cloudinary AI Auto-Tags</span>
                </h3>

                {/* Status Badge */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor:
                      media.taggingStatus === 'completed'
                        ? 'rgba(22, 163, 74, 0.12)'
                        : media.taggingStatus === 'unavailable'
                        ? 'rgba(234, 88, 12, 0.12)'
                        : media.taggingStatus === 'failed'
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(100, 116, 139, 0.12)',
                    color:
                      media.taggingStatus === 'completed'
                        ? '#16a34a'
                        : media.taggingStatus === 'unavailable'
                        ? '#ea580c'
                        : media.taggingStatus === 'failed'
                        ? '#ef4444'
                        : '#64748b',
                    textTransform: 'capitalize',
                  }}
                >
                  {media.taggingStatus || 'Unanalyzed'}
                </span>
              </div>

              {/* Tag Badges List */}
              {Array.isArray(media.tags) && media.tags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {media.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        color: 'var(--accent, #6366f1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                      }}
                    >
                      <Tag size={12} />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                  No AI tags assigned to this asset yet.
                </div>
              )}

              {/* Analyze with AI Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  icon={Sparkles}
                  style={{
                    fontSize: '13px',
                    padding: '8px 16px',
                    backgroundColor: isAnalyzing ? '#94a3b8' : '#4f46e5',
                  }}
                >
                  {isAnalyzing
                    ? 'Analyzing...'
                    : media.tags && media.tags.length > 0
                    ? 'Re-analyze with AI'
                    : 'Analyze with AI'}
                </Button>
                {isAnalyzing && (
                  <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '500' }}>
                    Requesting Cloudinary AI analysis...
                  </span>
                )}
              </div>

              {/* Notice / Addon Explanation Banner */}
              {(analysisNotice || media.taggingStatus === 'unavailable') && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    ...(analysisNotice?.type === 'success'
                      ? {
                          backgroundColor: '#f0fdf4',
                          borderColor: '#bbf7d0',
                          color: '#166534',
                        }
                      : {
                          backgroundColor: '#fffbeb',
                          borderColor: '#fef3c7',
                          color: '#92400e',
                        }),
                  }}
                >
                  <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                      {analysisNotice?.type === 'success'
                        ? 'Analysis Succeeded'
                        : 'Cloudinary Add-on Status'}
                    </div>
                    <div>
                      {analysisNotice?.text ||
                        media.taggingError ||
                        'Google Auto Tagging add-on is required for automatic AI tagging. Activate the free tier in Cloudinary Console (Settings > Add-ons).'}
                    </div>
                    {media.taggingStatus === 'unavailable' && (
                      <div style={{ marginTop: '6px' }}>
                        <a
                          href="https://console.cloudinary.com/app/settings/addons"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#4f46e5',
                            fontWeight: '600',
                            textDecoration: 'underline',
                          }}
                        >
                          Open Cloudinary Add-ons Settings &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content Safety Section (Phase 6: AI Content Moderation) */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border:
                  media.moderationStatus === 'approved'
                    ? '1px solid #bbf7d0'
                    : media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected'
                    ? '1px solid #fecaca'
                    : media.moderationStatus === 'pending'
                    ? '1px solid #fef3c7'
                    : '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '18px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color:
                      media.moderationStatus === 'approved'
                        ? '#166534'
                        : media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected'
                        ? '#991b1b'
                        : '#475569',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Shield size={16} />
                  <span>Content Safety</span>
                </h3>

                {/* Moderation Status Pill */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor:
                      media.moderationStatus === 'approved'
                        ? 'rgba(22, 163, 74, 0.12)'
                        : media.moderationStatus === 'pending'
                        ? 'rgba(234, 88, 12, 0.12)'
                        : media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected'
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(100, 116, 139, 0.12)',
                    color:
                      media.moderationStatus === 'approved'
                        ? '#16a34a'
                        : media.moderationStatus === 'pending'
                        ? '#ea580c'
                        : media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected'
                        ? '#ef4444'
                        : '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {media.moderationStatus === 'approved' && (
                    <>
                      <ShieldCheck size={12} />
                      <span>Approved</span>
                    </>
                  )}
                  {media.moderationStatus === 'pending' && (
                    <>
                      <Clock size={12} />
                      <span>Pending Analysis</span>
                    </>
                  )}
                  {(media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected') && (
                    <>
                      <ShieldAlert size={12} />
                      <span>Flagged / Rejected</span>
                    </>
                  )}
                  {media.moderationStatus === 'failed' && (
                    <>
                      <AlertTriangle size={12} />
                      <span>Check Failed</span>
                    </>
                  )}
                  {(!media.moderationStatus || media.moderationStatus === 'unavailable') && (
                    <>
                      <AlertTriangle size={12} />
                      <span>Moderation Unavailable</span>
                    </>
                  )}
                </span>
              </div>

              {/* Status Explanation */}
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                {media.moderationStatus === 'approved' && (
                  <p style={{ margin: 0, color: '#166534' }}>
                    ✓ <strong>Approved:</strong> Cloudinary AI moderation (Amazon Rekognition) found no blocking or unsafe content. Safe for delivery.
                  </p>
                )}
                {media.moderationStatus === 'pending' && (
                  <p style={{ margin: 0, color: '#b45309' }}>
                    ⏳ <strong>Pending Analysis:</strong> Cloudinary is processing content moderation on this asset.
                  </p>
                )}
                {(media.moderationStatus === 'flagged' || media.moderationStatus === 'rejected') && (
                  <p style={{ margin: 0, color: '#991b1b' }}>
                    ⚠ <strong>Flagged / Rejected:</strong> Cloudinary content safety detected potentially restricted content.
                  </p>
                )}
                {media.moderationStatus === 'failed' && (
                  <p style={{ margin: 0, color: '#64748b' }}>
                    Safety check encountered an issue ({media.moderationError || 'temporarily unavailable'}). You can retry running the check.
                  </p>
                )}
                {(!media.moderationStatus || media.moderationStatus === 'unavailable') && (
                  <p style={{ margin: 0, color: '#64748b' }}>
                    This asset does not yet have a content safety evaluation recorded.
                  </p>
                )}
              </div>

              {/* Moderation Labels (if any detected) */}
              {Array.isArray(media.moderationLabels) && media.moderationLabels.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Detected Moderation Categories
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {media.moderationLabels.map((lbl, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fca5a5',
                        }}
                      >
                        {lbl.label} {typeof lbl.confidence === 'number' ? `(${lbl.confidence.toFixed(1)}%)` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderation Provider & Timestamp */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border, #f1f5f9)',
                  fontSize: '11px',
                  color: '#94a3b8',
                  marginBottom: '14px',
                }}
              >
                <span>Provider: <strong>{media.moderationKind === 'aws_rek' ? 'Amazon Rekognition AI' : media.moderationKind || 'Cloudinary Moderation'}</strong></span>
                {media.moderationUpdatedAt && (
                  <span>Checked: {formatDate(media.moderationUpdatedAt)}</span>
                )}
              </div>

              {/* Moderation Action Button (Run Safety Check / Re-check Moderation) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={handleModerate}
                  disabled={isModerating}
                  icon={ShieldCheck}
                  style={{
                    fontSize: '13px',
                    padding: '8px 16px',
                  }}
                >
                  {isModerating
                    ? 'Checking Safety...'
                    : media.moderationStatus && media.moderationStatus !== 'pending'
                    ? 'Re-check Moderation'
                    : 'Run Safety Check'}
                </Button>
                {isModerating && (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Requesting Cloudinary safety check...
                  </span>
                )}
              </div>

              {/* Moderation Notice Banner */}
              {moderationNotice && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    ...(moderationNotice.type === 'success'
                      ? {
                          backgroundColor: '#f0fdf4',
                          borderColor: '#bbf7d0',
                          color: '#166534',
                        }
                      : {
                          backgroundColor: '#fef2f2',
                          borderColor: '#fecaca',
                          color: '#991b1b',
                        }),
                  }}
                >
                  <Info size={15} style={{ flexShrink: 0 }} />
                  <span>{moderationNotice.text}</span>
                </div>
              )}
            </div>

            {/* Structured Metadata Section (Phase 7: Cloudinary Structured Metadata) */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#6366f1',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Layers size={16} />
                  <span>Structured Metadata</span>
                </h3>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                  }}
                >
                  Cloudinary Sync
                </span>
              </div>

              {/* Metadata Key-Value Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                {/* Category */}
                <div
                  style={{
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    border: '1px solid var(--border, #f1f5f9)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      fontWeight: '600',
                    }}
                  >
                    Category
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#0f172a',
                    }}
                  >
                    {media.metadata?.category || 'General'}
                  </div>
                </div>

                {/* Content Type */}
                <div
                  style={{
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    border: '1px solid var(--border, #f1f5f9)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      fontWeight: '600',
                    }}
                  >
                    Content Type
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#0f172a',
                      textTransform: 'capitalize',
                    }}
                  >
                    {media.metadata?.contentType || media.resourceType || 'image'}
                  </div>
                </div>

                {/* Approval Status */}
                <div
                  style={{
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    border: '1px solid var(--border, #f1f5f9)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      fontWeight: '600',
                    }}
                  >
                    Approval Status
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color:
                        (media.metadata?.approvalStatus || '').toLowerCase() === 'approved'
                          ? '#16a34a'
                          : (media.metadata?.approvalStatus || '').toLowerCase() === 'pending'
                          ? '#ea580c'
                          : (media.metadata?.approvalStatus || '').toLowerCase() === 'flagged' ||
                            (media.metadata?.approvalStatus || '').toLowerCase() === 'rejected'
                          ? '#ef4444'
                          : '#475569',
                    }}
                  >
                    {media.metadata?.approvalStatus ||
                      (media.moderationStatus === 'approved' ? 'Approved' : 'Pending')}
                  </div>
                </div>

                {/* AI Processed */}
                <div
                  style={{
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    border: '1px solid var(--border, #f1f5f9)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      fontWeight: '600',
                    }}
                  >
                    AI Processed
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color:
                        media.metadata?.aiProcessed || media.taggingStatus === 'completed'
                          ? '#16a34a'
                          : '#64748b',
                    }}
                  >
                    {media.metadata?.aiProcessed || media.taggingStatus === 'completed' ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {/* Action Button: Sync Metadata */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={handleSyncMetadata}
                  disabled={isSyncingMeta}
                  icon={RefreshCw}
                  style={{
                    fontSize: '13px',
                    padding: '8px 16px',
                  }}
                >
                  {isSyncingMeta ? 'Syncing...' : 'Sync Metadata'}
                </Button>
                {isSyncingMeta && (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Updating structured metadata on Cloudinary...
                  </span>
                )}
              </div>

              {/* Metadata Notice Banner */}
              {metadataNotice && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    ...(metadataNotice.type === 'success'
                      ? {
                          backgroundColor: '#f0fdf4',
                          borderColor: '#bbf7d0',
                          color: '#166534',
                        }
                      : {
                          backgroundColor: '#fef2f2',
                          borderColor: '#fecaca',
                          color: '#991b1b',
                        }),
                  }}
                >
                  <Info size={15} style={{ flexShrink: 0 }} />
                  <span>{metadataNotice.text}</span>
                </div>
              )}
            </div>

            {/* AI Media Tools — Content-Aware Smart Cropping (Phase 8) */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              {/* Section Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#6366f1',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Crop size={16} />
                  <span>AI Media Tools — Smart Cropping</span>
                </h3>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                  }}
                >
                  g_auto · Content-Aware
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Cloudinary automatic gravity detects key subjects and crops dynamically, preserving visual focus without altering the original asset.
              </p>

              {/* Preset Selector Buttons */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    fontWeight: '600',
                  }}
                >
                  Select Aspect Ratio Preset
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CROP_PRESETS.map((preset) => {
                    const isActive = activeCropPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleGenerateCrop(preset.id)}
                        disabled={isCropping}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isActive ? '2px solid #6366f1' : '1px solid var(--border, #e2e8f0)',
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--code-bg, #f8fafc)',
                          cursor: isCropping ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          minWidth: '110px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '600', color: isActive ? '#4f46e5' : '#0f172a' }}>
                            {preset.label}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: isActive ? '#6366f1' : '#e2e8f0',
                              color: isActive ? '#ffffff' : '#64748b',
                            }}
                          >
                            {preset.ratio}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                          {preset.dims}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comparison Mode Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--code-bg, #f8fafc)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid var(--border, #f1f5f9)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                  <Eye size={14} style={{ color: '#6366f1' }} />
                  <span>
                    Comparison: <strong>{showCenterComparison ? 'Naive Center Crop vs AI Smart Crop' : 'Original vs AI Smart Crop'}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCenterComparison(!showCenterComparison)}
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #c7d2fe',
                    backgroundColor: showCenterComparison ? '#4f46e5' : '#ffffff',
                    color: showCenterComparison ? '#ffffff' : '#4f46e5',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {showCenterComparison ? '← View Original vs Smart Crop' : 'Compare with Center Crop (g_center) →'}
                </button>
              </div>

              {/* Error State */}
              {cropError && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    <span>{cropError}</span>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleGenerateCrop()}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Side-by-Side Comparison Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Left Panel: Original Asset OR Center Crop */}
                <div
                  style={{
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border, #e2e8f0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg, #ffffff)',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                      {showCenterComparison ? 'Standard Center Crop' : 'Original Asset'}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: showCenterComparison ? '#fee2e2' : '#f1f5f9',
                        color: showCenterComparison ? '#991b1b' : '#64748b',
                      }}
                    >
                      {showCenterComparison
                        ? 'g_center · Blind Crop'
                        : `${media.width || 0} × ${media.height || 0} · Untouched`}
                    </span>
                  </div>

                  <div
                    style={{
                      minHeight: '260px',
                      maxHeight: '380px',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={showCenterComparison ? smartCropData?.centerCropUrl || media.secureUrl : media.secureUrl}
                      alt={showCenterComparison ? 'Center Crop' : 'Original Media'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '380px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8' }}>
                    {showCenterComparison
                      ? 'Blindly centers on coordinates; may cut off off-center subjects.'
                      : 'Original asset remains untouched on Cloudinary and MongoDB.'}
                  </div>
                </div>

                {/* Right Panel: AI Smart Cropped Asset (g_auto) */}
                <div
                  style={{
                    border: '1px solid #c7d2fe',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #c7d2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#f5f7ff',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#312e81' }}>
                      AI Content-Aware Smart Crop
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={11} />
                      g_auto · {smartCropData?.presetInfo?.name || 'Square'} ({smartCropData?.presetInfo?.dims || '800 × 800'})
                    </span>
                  </div>

                  <div
                    style={{
                      minHeight: '260px',
                      maxHeight: '380px',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isCropping ? (
                      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#ffffff' }}>
                        <Loader size={28} text="Generating smart crop via Cloudinary..." />
                      </div>
                    ) : !cropImgError && smartCropData?.url ? (
                      <img
                        src={smartCropData.url}
                        alt="Content-Aware Smart Crop"
                        onError={() => setCropImgError(true)}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '380px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div style={{ padding: '30px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                        <AlertTriangle size={24} style={{ margin: '0 auto 6px auto', color: '#f59e0b' }} />
                        <div>{cropImgError ? 'Preview temporarily unavailable.' : 'Select a preset above to preview.'}</div>
                      </div>
                    )}
                  </div>

                  {/* Transformed URL and External Action */}
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: '#166534', fontWeight: '500' }}>
                      ✓ Derived delivery URL generated dynamically
                    </span>
                    {smartCropData?.url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopy(smartCropData.url, 'crop_url')}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: copiedField === 'crop_url' ? '#16a34a' : '#4f46e5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0,
                          }}
                        >
                          {copiedField === 'crop_url' ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedField === 'crop_url' ? 'Copied URL!' : 'Copy URL'}</span>
                        </button>
                        <a
                          href={smartCropData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#4f46e5',
                            textDecoration: 'underline',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <span>Open Image</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider between Smart Crop and Background Removal */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'var(--border, #e2e8f0)',
                  margin: '24px 0',
                }}
              />

              {/* Phase 9: AI Background Removal */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#6366f1',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Wand2 size={16} />
                    <span>AI Background Removal</span>
                  </h4>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#4f46e5',
                    }}
                  >
                    e_background_removal · Transparent PNG
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                  Cloudinary AI isolates the main subject and generates a derived transparent PNG asset without altering the original.
                </p>

                {/* Remove Background Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg || (media.resourceType && media.resourceType !== 'image')}
                    icon={Wand2}
                    style={{
                      fontSize: '13px',
                      padding: '8px 18px',
                      backgroundColor: isRemovingBg ? '#94a3b8' : '#4f46e5',
                    }}
                  >
                    {isRemovingBg ? 'Removing background...' : 'Remove Background'}
                  </Button>
                  {isRemovingBg && (
                    <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '500' }}>
                      Removing background...
                    </span>
                  )}
                </div>

                {/* Error Banner */}
                {bgRemovalError && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} />
                      <span>{bgRemovalError}</span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleRemoveBackground}
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Side-by-Side Comparison: Original vs Background Removed */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {/* Left: Original Asset */}
                  <div
                    style={{
                      border: '1px solid var(--border, #e2e8f0)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--code-bg, #f8fafc)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border, #e2e8f0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--bg, #ffffff)',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                        Original
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                        }}
                      >
                        {media.width || 0} × {media.height || 0} · Untouched
                      </span>
                    </div>

                    <div
                      style={{
                        minHeight: '260px',
                        maxHeight: '380px',
                        backgroundColor: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={media.secureUrl}
                        alt="Original Asset"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '380px',
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8' }}>
                      Original asset remains untouched on Cloudinary and MongoDB.
                    </div>
                  </div>

                  {/* Right: Background Removed (Transparent Preview) */}
                  <div
                    style={{
                      border: '1px solid #c7d2fe',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--code-bg, #f8fafc)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #c7d2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#f5f7ff',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#312e81' }}>
                        Background Removed
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Check size={11} />
                        Transparent PNG
                      </span>
                    </div>

                    <div
                      style={{
                        minHeight: '260px',
                        maxHeight: '380px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        backgroundImage:
                          'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      }}
                    >
                      {isRemovingBg ? (
                        <div
                          style={{
                            padding: '40px 16px',
                            textAlign: 'center',
                            color: '#4f46e5',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '8px',
                          }}
                        >
                          <Loader size={28} text="Removing background via Cloudinary AI..." />
                        </div>
                      ) : !bgImgError && bgRemovalData?.backgroundRemovedUrl ? (
                        <img
                          src={bgRemovalData.backgroundRemovedUrl}
                          alt="Background Removed (Transparent)"
                          onError={() => setBgImgError(true)}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '380px',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            padding: '30px 16px',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.85)',
                            borderRadius: '8px',
                          }}
                        >
                          <Wand2 size={24} style={{ margin: '0 auto 6px auto', color: '#6366f1' }} />
                          <div>
                            {bgImgError
                              ? 'Preview temporarily unavailable.'
                              : 'Click "Remove Background" above to generate transparent preview.'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Transformed URL and External Action */}
                    <div
                      style={{
                        padding: '8px 12px',
                        fontSize: '11px',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <span style={{ color: '#166534', fontWeight: '500' }}>
                        {bgRemovalData?.backgroundRemovedUrl
                          ? '✓ Derived transparent PNG generated'
                          : 'Derived output'}
                      </span>
                      {bgRemovalData?.backgroundRemovedUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleCopy(bgRemovalData.backgroundRemovedUrl, 'bg_url')}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: copiedField === 'bg_url' ? '#16a34a' : '#4f46e5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: 0,
                            }}
                          >
                            {copiedField === 'bg_url' ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedField === 'bg_url' ? 'Copied URL!' : 'Copy URL'}</span>
                          </button>
                          <a
                            href={bgRemovalData.backgroundRemovedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#4f46e5',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <span>Open Image</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 11: Unified Image Transformation Studio */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              {/* Studio Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#6366f1',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sliders size={16} />
                  <span>Transformation Studio</span>
                </h3>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                  }}
                >
                  Unified Pipeline · Cloudinary AI
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Combine content-aware smart cropping, AI background removal, and format/quality optimization into a single derived Cloudinary delivery output.
              </p>

              {/* Control 1: Preset Selection */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    fontWeight: '600',
                  }}
                >
                  Preset
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CROP_PRESETS.map((preset) => {
                    const isActive = selectedStudioPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedStudioPreset(preset.id)}
                        disabled={isTransforming}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isActive ? '2px solid #6366f1' : '1px solid var(--border, #e2e8f0)',
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--code-bg, #f8fafc)',
                          cursor: isTransforming ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          minWidth: '105px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '600', color: isActive ? '#4f46e5' : '#0f172a' }}>
                            {preset.label}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: isActive ? '#6366f1' : '#e2e8f0',
                              color: isActive ? '#ffffff' : '#64748b',
                            }}
                          >
                            {preset.ratio}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                          {preset.dims}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Control 2: Background Option Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    fontWeight: '600',
                  }}
                >
                  Background
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStudioRemoveBg(false)}
                    disabled={isTransforming}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: !studioRemoveBg ? '2px solid #6366f1' : '1px solid var(--border, #e2e8f0)',
                      backgroundColor: !studioRemoveBg ? 'rgba(99, 102, 241, 0.08)' : 'var(--code-bg, #f8fafc)',
                      color: !studioRemoveBg ? '#4f46e5' : '#475569',
                      fontWeight: !studioRemoveBg ? '700' : '500',
                      fontSize: '13px',
                      cursor: isTransforming ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Keep Background
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioRemoveBg(true)}
                    disabled={isTransforming}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: studioRemoveBg ? '2px solid #6366f1' : '1px solid var(--border, #e2e8f0)',
                      backgroundColor: studioRemoveBg ? 'rgba(99, 102, 241, 0.08)' : 'var(--code-bg, #f8fafc)',
                      color: studioRemoveBg ? '#4f46e5' : '#475569',
                      fontWeight: studioRemoveBg ? '700' : '500',
                      fontSize: '13px',
                      cursor: isTransforming ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Wand2 size={14} />
                    <span>Remove Background</span>
                  </button>
                </div>
              </div>

              {/* Delivery Specification Indicator & Action Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--code-bg, #f8fafc)',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #f1f5f9)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#475569' }}>
                  <div>
                    Delivery: <strong style={{ color: '#0f172a' }}>Format: Auto</strong> · <strong style={{ color: '#0f172a' }}>Quality: Auto</strong>
                  </div>
                  <div>
                    Crop: <strong style={{ color: '#4f46e5' }}>g_auto · Content-Aware</strong>
                  </div>
                  {studioRemoveBg && (
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                      Transparent PNG
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  onClick={() => handleGenerateStudioTransform()}
                  disabled={isTransforming || (media.resourceType && media.resourceType !== 'image')}
                  icon={Sparkles}
                  style={{
                    fontSize: '13px',
                    padding: '8px 18px',
                    backgroundColor: isTransforming ? '#94a3b8' : '#4f46e5',
                  }}
                >
                  {isTransforming ? 'Generating transformation...' : 'Generate Preview'}
                </Button>
              </div>

              {/* Error State */}
              {studioError && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    <span>{studioError}</span>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleGenerateStudioTransform()}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Side-by-Side Comparison: Original vs Transformed */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Left Panel: Original Asset */}
                <div
                  style={{
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border, #e2e8f0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg, #ffffff)',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                      Original
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                      }}
                    >
                      {media.width || 0} × {media.height || 0} · Untouched
                    </span>
                  </div>

                  <div
                    style={{
                      minHeight: '260px',
                      maxHeight: '380px',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={media.secureUrl}
                      alt="Original Asset"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '380px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8' }}>
                    Original asset remains untouched on Cloudinary and MongoDB.
                  </div>
                </div>

                {/* Right Panel: Transformed Output */}
                <div
                  style={{
                    border: '1px solid #c7d2fe',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #c7d2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#f5f7ff',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#312e81' }}>
                      Transformed Output
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={11} />
                      {studioTransformData?.presetInfo?.name || selectedStudioPreset.toUpperCase()}{' '}
                      {studioTransformData?.removeBackground ? '· No BG' : '· f_auto'}
                    </span>
                  </div>

                  <div
                    style={{
                      minHeight: '260px',
                      maxHeight: '380px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      ...(studioTransformData?.removeBackground || studioRemoveBg
                        ? {
                            backgroundColor: '#ffffff',
                            backgroundImage:
                              'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                          }
                        : {
                            backgroundColor: '#0f172a',
                          }),
                    }}
                  >
                    {isTransforming ? (
                      <div
                        style={{
                          padding: '40px 16px',
                          textAlign: 'center',
                          color: '#4f46e5',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '8px',
                        }}
                      >
                        <Loader size={28} text="Generating transformation via Cloudinary..." />
                      </div>
                    ) : !studioImgError && studioTransformData?.transformedUrl ? (
                      <img
                        src={studioTransformData.transformedUrl}
                        alt="Transformed Preview"
                        onError={() => setStudioImgError(true)}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '380px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: '30px 16px',
                          textAlign: 'center',
                          color: '#64748b',
                          fontSize: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.85)',
                          borderRadius: '8px',
                        }}
                      >
                        <Sparkles size={24} style={{ margin: '0 auto 6px auto', color: '#6366f1' }} />
                        <div>
                          {studioImgError
                            ? 'Preview temporarily unavailable.'
                            : 'Choose preset and background options, then click "Generate Preview".'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transformed URL and External Actions */}
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: '#166534', fontWeight: '500' }}>
                      {studioTransformData?.transformedUrl
                        ? '✓ Real Cloudinary derived transformation active'
                        : 'Derived output'}
                    </span>
                    {studioTransformData?.transformedUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopy(studioTransformData.transformedUrl, 'studio_url')}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: copiedField === 'studio_url' ? '#16a34a' : '#4f46e5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0,
                          }}
                        >
                          {copiedField === 'studio_url' ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedField === 'studio_url' ? 'Copied URL!' : 'Copy Cloudinary URL'}</span>
                        </button>
                        <a
                          href={studioTransformData.transformedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#4f46e5',
                            textDecoration: 'underline',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <span>Open Result</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 10: Delivery Optimization Section */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#6366f1',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Zap size={16} />
                  <span>Delivery Optimization</span>
                </h3>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                  }}
                >
                  f_auto · q_auto · CDN Edge
                </span>
              </div>

              {/* Delivery Parameters Comparison Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                {/* Original Stored Asset Box */}
                <div
                  style={{
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    border: '1px solid var(--border, #f1f5f9)',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      fontWeight: '700',
                    }}
                  >
                    Original Stored Asset
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                    <div>Format: <strong>{media.format ? media.format.toUpperCase() : 'Original'}</strong></div>
                    <div>Dimensions: <strong>{media.width && media.height ? `${media.width} × ${media.height} px` : 'Original'}</strong></div>
                    <div>Stored Size: <strong>{formatBytes(media.bytes)}</strong></div>
                  </div>
                </div>

                {/* Optimized Delivery Box */}
                <div
                  style={{
                    backgroundColor: '#f5f7ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#4f46e5',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      fontWeight: '700',
                    }}
                  >
                    Optimized Delivery (Active)
                  </div>
                  <div style={{ fontSize: '12px', color: '#312e81', lineHeight: 1.6 }}>
                    <div>Format: <strong>Auto (f_auto · WebP/AVIF)</strong></div>
                    <div>Quality: <strong>Auto (q_auto · Perceptual)</strong></div>
                    <div>Max Preview Width: <strong>1600 px (c_limit)</strong></div>
                  </div>
                </div>
              </div>

              {/* Delivery Features List */}
              <div
                style={{
                  fontSize: '12px',
                  color: '#166534',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} />
                  <span>Auto Format enabled (delivers best format per browser)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} />
                  <span>Auto Quality enabled (intelligent perceptual compression)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} />
                  <span>Delivered globally through Cloudinary CDN</span>
                </div>
              </div>

              {/* Optimized Delivery URL copy & open */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: '#64748b' }}>
                  Preview delivered via optimized URL
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(getOptimizedUrl(media, { width: 1600, crop: 'limit' }), 'opt_url')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: copiedField === 'opt_url' ? '#16a34a' : '#4f46e5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    {copiedField === 'opt_url' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedField === 'opt_url' ? 'Copied Optimized URL!' : 'Copy Optimized URL'}</span>
                  </button>
                  <a
                    href={getOptimizedUrl(media, { width: 1600, crop: 'limit' })}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#4f46e5',
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <span>Open Optimized Image</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>

            {/* Cloudinary Information Section */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  margin: '0 0 14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Cloud size={15} />
                <span>Cloudinary Information</span>
              </h3>

              {/* Public ID */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Public ID
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--code-bg, #f8fafc)',
                    borderRadius: '6px',
                  }}
                >
                  <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{media.publicId}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(media.publicId, 'public_id')}
                    title="Copy Public ID"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: copiedField === 'public_id' ? '#16a34a' : '#64748b',
                    }}
                  >
                    {copiedField === 'public_id' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Folder */}
              {media.folder && (
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Folder
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{media.folder}</div>
                </div>
              )}
            </div>

            {/* MongoDB Information Section */}
            <div
              style={{
                backgroundColor: 'var(--bg, #ffffff)',
                border: '1px solid #c7d2fe',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#4f46e5',
                  margin: '0 0 14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Database size={15} />
                <span>MongoDB Persistence</span>
              </h3>

              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  MongoDB Document ID
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f5f7ff',
                    borderRadius: '6px',
                  }}
                >
                  <code style={{ fontSize: '13px', color: '#312e81', fontWeight: '600', wordBreak: 'break-all' }}>
                    {media._id}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(media._id, 'mongo_id')}
                    title="Copy MongoDB ID"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: copiedField === 'mongo_id' ? '#16a34a' : '#64748b',
                    }}
                  >
                    {copiedField === 'mongo_id' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
