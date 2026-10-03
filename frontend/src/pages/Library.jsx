import React, { useState, useEffect, useCallback } from 'react';
import {
  Film,
  RotateCw,
  UploadCloud,
  AlertTriangle,
  ArrowUpDown,
  Image as ImageIcon,
  Video,
  Layers,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import MediaCard from '../components/media/MediaCard';
import Button from '../components/common/Button';
import { getMedia, searchMedia } from '../services/api';

/**
 * Library Page - Phase 3: Smart Media Library UI & Phase 5: Intelligent Media Search
 */
export default function Library({ onSelectMedia, onNavigateToUpload }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'image' | 'video'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Phase 5: Search states
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null when no search is active
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const fetchMedia = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    setError('');

    try {
      const data = await getMedia();
      setMediaList(Array.isArray(data.media) ? data.media : []);
    } catch (err) {
      console.error('[Library Error] Failed to fetch media:', err);
      setError('Unable to load your media library. Please check your backend and database connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getMedia();
        if (isMounted) {
          setMediaList(Array.isArray(data.media) ? data.media : []);
        }
      } catch (err) {
        console.error('[Library Error] Failed to fetch media:', err);
        if (isMounted) {
          setError('Unable to load your media library. Please check your backend and database connection.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Search Submission (Search button or Enter key)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const trimmed = searchInput.trim();

    if (!trimmed) {
      // Empty search resets to full library
      if (activeSearchQuery) {
        handleClearSearch();
      }
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const data = await searchMedia(trimmed);
      setSearchResults(Array.isArray(data.media) ? data.media : []);
      setActiveSearchQuery(trimmed);
    } catch (err) {
      console.error('[Library Search Error]:', err);
      setSearchError('Unable to search media. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Clear active search and restore full library view
  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearchQuery('');
    setSearchResults(null);
    setSearchError('');
  };

  const handleManualRefresh = () => {
    if (activeSearchQuery) {
      handleSearch();
    } else {
      fetchMedia(true);
    }
  };

  // Base list is search results when searching, otherwise full media library
  const displayedBaseList = activeSearchQuery ? (searchResults || []) : mediaList;

  // Filtering by resourceType
  const filteredList = displayedBaseList.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'image') return item.resourceType === 'image' || !item.resourceType;
    if (filterType === 'video') return item.resourceType === 'video';
    return true;
  });

  // Client-side sorting
  const sortedList = [...filteredList].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const filterTabs = [
    { id: 'all', label: 'All Assets', icon: Layers, count: displayedBaseList.length },
    {
      id: 'image',
      label: 'Images',
      icon: ImageIcon,
      count: displayedBaseList.filter((m) => m.resourceType === 'image' || !m.resourceType).length,
    },
    {
      id: 'video',
      label: 'Videos',
      icon: Video,
      count: displayedBaseList.filter((m) => m.resourceType === 'video').length,
    },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1280px', margin: '0 auto', textAlign: 'left' }}>
      {/* Header with Title and Actions */}
      <header
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-bg, rgba(99, 102, 241, 0.12))',
                color: 'var(--accent, #6366f1)',
                display: 'flex',
              }}
            >
              <Film size={22} />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0 }}>Media Library</h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Explore and inspect your Cloudinary-hosted assets persisted in MongoDB Atlas.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            icon={RotateCw}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {onNavigateToUpload && (
            <Button
              variant="primary"
              onClick={onNavigateToUpload}
              icon={UploadCloud}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              Upload Asset
            </Button>
          )}
        </div>
      </header>

      {/* Search Bar (Phase 5: Intelligent Media Search) */}
      <div style={{ marginBottom: '22px' }}>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search your media by AI tags, filename, or ID (e.g. dog, blazer)..."
              disabled={isSearching}
              style={{
                width: '100%',
                padding: '11px 40px 11px 40px',
                borderRadius: '8px',
                border: '1px solid var(--border, #cbd5e1)',
                backgroundColor: 'var(--bg, #ffffff)',
                color: 'var(--text-h, #0f172a)',
                fontSize: '14px',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent, #6366f1)';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border, #cbd5e1)';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                title="Clear query"
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            icon={Search}
            disabled={isSearching || !searchInput.trim()}
            style={{ fontSize: '13px', padding: '10px 18px', whiteSpace: 'nowrap' }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>

          {activeSearchQuery && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearSearch}
              icon={X}
              style={{ fontSize: '13px', padding: '10px 14px', whiteSpace: 'nowrap' }}
            >
              Clear
            </Button>
          )}
        </form>

        {/* Active Search Indicator Banner */}
        {activeSearchQuery && !isSearching && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              marginTop: '10px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-bg, rgba(99, 102, 241, 0.08))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '13px',
              color: 'var(--accent, #6366f1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} />
              <span>
                Search results for: <strong>"{activeSearchQuery}"</strong>
                {' '}({searchResults ? searchResults.length : 0} found via Cloudinary Search API)
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent, #6366f1)',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
              }}
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Search Error State */}
      {searchError && (
        <div
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b', fontSize: '14px' }}>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <span>{searchError}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              onClick={handleSearch}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearSearch}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Filter Toolbar & Sort Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border, #e2e8f0)',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid var(--accent, #6366f1)' : '1px solid var(--border, #e2e8f0)',
                  backgroundColor: isActive ? 'var(--accent-bg, rgba(99, 102, 241, 0.1))' : 'var(--bg, #ffffff)',
                  color: isActive ? 'var(--accent, #6366f1)' : '#64748b',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'var(--accent, #6366f1)' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b',
                    marginLeft: '2px',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpDown size={15} style={{ color: '#94a3b8' }} />
          <span style={{ fontSize: '13px', color: '#64748b' }}>Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border, #e2e8f0)',
              backgroundColor: 'var(--bg, #ffffff)',
              color: 'var(--text-h, #0f172a)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: Loading vs Error vs Empty vs Grid */}
      {loading || isSearching ? (
        // Skeleton Loading Grid
        <div>
          {isSearching && (
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
              Searching media via Cloudinary Search API...
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--code-bg, #f8fafc)',
                }}
              >
                <div
                  style={{
                    height: '190px',
                    backgroundColor: '#e2e8f0',
                    opacity: 0.6,
                  }}
                />
                <div style={{ padding: '14px', display: 'grid', gap: '8px' }}>
                  <div style={{ height: '14px', width: '70%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                  <div style={{ height: '12px', width: '45%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        // Library Load Error State
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            maxWidth: '540px',
            margin: '40px auto',
          }}
        >
          <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#991b1b', fontWeight: '600' }}>
            Unable to load your media library
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#7f1d1d', fontSize: '14px' }}>
            {error}
          </p>
          <Button variant="primary" onClick={handleManualRefresh} icon={RotateCw}>
            Retry
          </Button>
        </div>
      ) : activeSearchQuery && displayedBaseList.length === 0 ? (
        // Zero Search Results State (Phase 5 requirement)
        <div
          style={{
            padding: '72px 24px',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed var(--border, #cbd5e1)',
            backgroundColor: 'var(--code-bg, #f8fafc)',
            maxWidth: '600px',
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-bg, rgba(99, 102, 241, 0.12))',
              color: 'var(--accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Search size={30} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: 'var(--text-h, #0f172a)' }}>
            No media found for "{activeSearchQuery}"
          </h3>
          <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', maxWidth: '420px', display: 'inline-block' }}>
            We couldn't find any media assets matching your query. Try searching for terms like dog, blazer, or outdoor.
          </p>

          <div>
            <Button variant="primary" onClick={handleClearSearch} icon={X}>
              Clear Search
            </Button>
          </div>
        </div>
      ) : sortedList.length === 0 ? (
        // Empty State (Filter empty or zero uploads)
        <div
          style={{
            padding: '72px 24px',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed var(--border, #cbd5e1)',
            backgroundColor: 'var(--code-bg, #f8fafc)',
            maxWidth: '600px',
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-bg, rgba(99, 102, 241, 0.12))',
              color: 'var(--accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Film size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
            {filterType !== 'all' ? `No ${filterType}s found` : 'No media uploaded yet'}
          </h3>
          <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', maxWidth: '380px', display: 'inline-block' }}>
            {filterType !== 'all'
              ? `There are no media assets matching the "${filterType}" filter.`
              : 'Upload your first image to ingest it into Cloudinary and persist its record in MongoDB.'}
          </p>

          <div>
            {filterType !== 'all' ? (
              <Button variant="secondary" onClick={() => setFilterType('all')}>
                Show All {activeSearchQuery ? 'Results' : 'Assets'}
              </Button>
            ) : onNavigateToUpload ? (
              <Button variant="primary" onClick={onNavigateToUpload} icon={UploadCloud}>
                Upload Your First Image
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        // Media Cards Responsive Grid
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '22px',
          }}
        >
          {sortedList.map((media) => (
            <MediaCard
              key={media._id || media.publicId}
              media={media}
              onSelect={(selected) => onSelectMedia && onSelectMedia(selected._id || selected.publicId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
