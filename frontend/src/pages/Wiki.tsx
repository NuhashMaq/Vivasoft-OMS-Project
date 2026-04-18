import React, { useState } from 'react';
import { SearchBar } from '../components/wiki/SearchBar';
import { ResultList, WikiArticle } from '../components/wiki/ResultList';
import { WikiViewer } from '../components/wiki/WikiViewer';
import { Loader } from '../components/common/Loader';
import { searchWiki } from '../services/wikiService';
import './WikiPage.css';

export const WikiPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setSelectedArticle(null);
    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const res = await searchWiki(searchQuery);
      setResults(res || []);
    } catch (err) {
      console.error('Wiki search error:', err);
      setResults([]);
      const msg = err instanceof Error ? err.message : 'Failed to search wiki';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wiki-page">
      <div className="wiki-header">
        <h1>Project Wiki</h1>
        <p>Search and explore project documentation and resources</p>
      </div>

      <SearchBar onSearch={handleSearch} />

      {error && (
        <div className="wiki-no-results" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <p>{error}</p>
        </div>
      )}

      {loading && <Loader />}

      {!loading && selectedArticle ? (
        <WikiViewer
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
        />
      ) : !loading && searched && results.length === 0 ? (
        <div className="wiki-no-results">
          <p>No results found for "{query}". Try a different search.</p>
        </div>
      ) : !loading && searched ? (
        <ResultList results={results} onSelect={setSelectedArticle} />
      ) : (
        <div className="wiki-welcome">
          <p>Start by searching for projects, documentation, or resources above.</p>
        </div>
      )}
    </div>
  );
};
