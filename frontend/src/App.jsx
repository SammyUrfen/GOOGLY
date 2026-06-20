import React, { useState, useEffect, useRef } from 'react';
import useDebouncedValue from './hooks/useDebouncedValue';
import { fetchSuggestions, submitSearch, fetchTrending } from './api/typeaheadApi';
import './App.css';

const SearchIcon = () => (
  <svg focusable="false" viewBox="0 0 24 24">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const TrendingIcon = () => (
  <svg focusable="false" viewBox="0 0 24 24">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
);

export default function App() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [banner, setBanner] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchTrending().then(data => setTrending(data)).catch(() => {});
    
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    let isCancelled = false;
    
    fetchSuggestions(debouncedQuery)
      .then(data => {
        if (!isCancelled) {
          setSuggestions(data.suggestions || []);
          setError(false);
        }
      })
      .catch((e) => {
        if (!isCancelled) setError(true);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
      
    return () => { isCancelled = true; };
  }, [debouncedQuery]);

  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;
    submitSearch(searchQuery).then(() => {
      setBanner('Searched: ' + searchQuery);
      setTimeout(() => setBanner(null), 3000);
    });
    setFocused(false);
    setQuery(searchQuery);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSearch(suggestions[activeIndex].query);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  const showDropdown = focused && query.trim() && (suggestions.length > 0 || loading || error || (!loading && suggestions.length === 0));

  return (
    <>
      {/* Packaging-inspired animated backdrop */}
      <div className="bg-stage" aria-hidden="true">
        <div className="bg-base" />
        <div className="bg-rays" />
        <div className="bg-rings" />
        <div className="bg-glow" />
        <div className="bg-vignette" />
      </div>
      <svg className="svg-defs" aria-hidden="true" focusable="false">
        <defs>
          {/* feTurbulence + displacement warps the concentric rings into the
              organic hand-drawn swirl seen on the Googly wrapper */}
          <filter id="googly-wobble" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.016"
                          numOctaves="3" seed="11" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="46"
                               xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Bisk Farm "Flavourful 25 Years" ribbon, echoing the wrapper */}
      <div className="brand-badge" aria-label="Bisk Farm — Flavourful 25 Years">
        <span className="bb-top">BISK&nbsp;FARM</span>
        <span className="bb-mid">FLAVOURFUL</span>
        <span className="bb-big">25</span>
        <span className="bb-bot">★ YEARS ★</span>
      </div>

      <div className="logo-container" role="img" aria-label="Googly">
        <div className="googly-text" aria-hidden="true">
          <span className="ltr">G</span>
          <span className="eye"><i /></span>
          <span className="eye"><i /></span>
          <span className="ltr">g</span>
          <span className="ltr">l</span>
          <span className="ltr">y</span>
        </div>
        <div className="tagline" aria-hidden="true">
          <span className="t-small">THE TASTE</span>
          <span className="t-tiny">WITH A</span>
          <span className="t-twist">TWIST</span>
        </div>
      </div>

      <div className="search-wrapper" ref={wrapperRef}>
        <div className={`search-box-container ${showDropdown ? 'focused' : ''}`}>
          <div className="search-icon"><SearchIcon /></div>
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onClick={() => setFocused(true)}
            onKeyDown={onKeyDown}
          />
        </div>
        
        {showDropdown && (
          <div className="dropdown">
            {error && <div className="error">Couldn't load suggestions</div>}
            {loading && !error && <div className="loading">Loading...</div>}
            {!loading && !error && suggestions.length === 0 && <div className="loading">No matches</div>}
            {suggestions.map((item, i) => (
              <div 
                key={item.query} 
                className={`dropdown-item ${i === activeIndex ? 'active' : ''}`}
                onClick={() => handleSearch(item.query)}
              >
                <SearchIcon />
                <span>{item.query}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="search-buttons">
        <button className="search-button" onClick={() => handleSearch(query)}>Googly Search</button>
        <button className="search-button">I'm Feeling Lucky</button>
      </div>

      {trending.length > 0 && (
        <div className="trending-panel">
          <div className="trending-title">Trending searches</div>
          <div className="trending-chips">
            {trending.map(t => (
              <div key={t.query} className="trending-chip" onClick={() => handleSearch(t.query)}>
                <TrendingIcon />
                <span>{t.query}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {banner && <div className="banner">{banner}</div>}
    </>
  );
}
