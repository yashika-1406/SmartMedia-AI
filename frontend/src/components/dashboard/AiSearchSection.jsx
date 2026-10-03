import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchMedia } from '../../services/api';

export default function AiSearchSection({ mediaList = [], onSelectMedia }) {
  // Extract unique popular real tags from the loaded media assets
  const extractedTags = Array.from(
    new Set(
      mediaList
        .flatMap((m) => {
          if (Array.isArray(m.tags)) return m.tags;
          if (typeof m.tags === 'string') return m.tags.split(' ');
          return [];
        })
        .filter((t) => t && t.length > 2)
    )
  ).slice(0, 8);

  const [query, setQuery] = useState(extractedTags[0] || '');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e, forcedQuery) => {
    if (e) e.preventDefault();
    const q = forcedQuery !== undefined ? forcedQuery : query;
    if (!q || !q.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchMedia(q.trim());
      if (data && Array.isArray(data.media)) {
        setSearchResults(data.media);
      } else {
        // Fallback filter over client-loaded list
        const filtered = mediaList.filter((m) => {
          const tagsStr = Array.isArray(m.tags) ? m.tags.join(' ') : String(m.tags || '');
          return (
            tagsStr.toLowerCase().includes(q.toLowerCase()) ||
            (m.originalFilename || '').toLowerCase().includes(q.toLowerCase()) ||
            (m.publicId || '').toLowerCase().includes(q.toLowerCase())
          );
        });
        setSearchResults(filtered);
      }
    } catch (err) {
      console.warn('Search query fallback to local assets:', err.message);
      const filtered = mediaList.filter((m) => {
        const tagsStr = Array.isArray(m.tags) ? m.tags.join(' ') : String(m.tags || '');
        return tagsStr.toLowerCase().includes(q.toLowerCase());
      });
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChipClick = (tag) => {
    setQuery(tag);
    handleSearch(null, tag);
  };

  const displayedList = searchResults !== null ? searchResults : mediaList.slice(0, 6);

  return (
    <div className="ai-search-card">
      <form className="ai-search-bar" onSubmit={handleSearch}>
        <div className="ai-search-input-wrap">
          <Search />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets by tag, filename, or category..."
          />
        </div>
        <button type="submit" className="btn-ai-search" disabled={isSearching}>
          {isSearching ? <Loader2 size={13} className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {extractedTags.length > 0 && (
        <div className="tag-results-row">
          <div className="tags-list">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Indexed Tags:</span>
            {extractedTags.map((tag) => (
              <span
                key={tag}
                className="tag-chip"
                onClick={() => handleChipClick(tag)}
              >
                #{tag}
              </span>
            ))}
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {displayedList.length} {displayedList.length === 1 ? 'match' : 'matches'}
          </span>
        </div>
      )}

      {displayedList.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          No matching assets found for "{query}".
        </div>
      ) : (
        <div className="search-results-gallery">
          {displayedList.map((item) => (
            <div
              key={item._id}
              className="library-item-card"
              style={{ aspectRatio: '16/10' }}
              onClick={() => onSelectMedia(item)}
            >
              <img
                src={item.secureUrl}
                alt={item.tags?.[0] || 'Search Result'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
