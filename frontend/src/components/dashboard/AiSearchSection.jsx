import React, { useState } from 'react';
import { Search, Sparkles, Plus, ChevronRight } from 'lucide-react';
import { searchMedia } from '../../services/api';

export default function AiSearchSection({ onSelectMedia }) {
  const [query, setQuery] = useState('dog glasses laptop');
  const [activeTags, setActiveTags] = useState(['dog', 'glasses', 'laptop']);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Curated results matching the mockup
  const defaultSearchResults = [
    {
      _id: 'search-1',
      secureUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80',
      tags: ['dog', 'glasses', 'pet'],
    },
    {
      _id: 'search-2',
      secureUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80',
      tags: ['dog', 'cute', 'portrait'],
    },
    {
      _id: 'search-3',
      secureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      tags: ['person', 'glasses', 'laptop'],
    },
    {
      _id: 'search-4',
      secureUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80',
      tags: ['dog', 'glasses', 'indoor'],
    },
    {
      _id: 'search-5',
      secureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      tags: ['person', 'dog', 'outdoor'],
    },
    {
      _id: 'search-6',
      secureUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80',
      tags: ['dog', 'glasses'],
    },
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const data = await searchMedia(query);
      if (data && data.media && data.media.length > 0) {
        setSearchResults(data.media);
      } else {
        setSearchResults(defaultSearchResults);
      }
    } catch (err) {
      console.warn('API search fell back to local results:', err.message);
      setSearchResults(defaultSearchResults);
    } finally {
      setIsSearching(false);
    }
  };

  const removeTag = (tagToRemove) => {
    setActiveTags(activeTags.filter((t) => t !== tagToRemove));
  };

  const resultsList = searchResults.length > 0 ? searchResults : defaultSearchResults;

  return (
    <div className="ai-search-card">
      <form className="ai-search-bar" onSubmit={handleSearch}>
        <div className="ai-search-input-wrap">
          <Search />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search with natural keywords..."
          />
        </div>
        <button type="submit" className="btn-ai-search" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="tag-results-row">
        <div className="tags-list">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tag Results:</span>
          {activeTags.map((tag) => (
            <span key={tag} className="tag-chip" onClick={() => removeTag(tag)}>
              {tag} ×
            </span>
          ))}
          <button
            type="button"
            className="btn-add-tag"
            onClick={() => {
              const newTag = prompt('Enter additional tag:');
              if (newTag) setActiveTags([...activeTags, newTag.trim()]);
            }}
          >
            <Plus size={11} />
            <span>Add Tag</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {resultsList.length} results
          </span>
          <button
            type="button"
            className="btn-view-all"
            style={{ fontSize: '11px' }}
          >
            <span>View All</span>
            <ChevronRight size={11} />
          </button>
        </div>
      </div>

      <div className="search-results-gallery">
        {resultsList.map((item, idx) => (
          <div
            key={item._id || idx}
            className="library-item-card"
            style={{ aspectRatio: '16/10' }}
            onClick={() => onSelectMedia(item)}
          >
            <img src={item.secureUrl} alt={item.tags?.[0] || 'Result'} />
          </div>
        ))}
      </div>
    </div>
  );
}
