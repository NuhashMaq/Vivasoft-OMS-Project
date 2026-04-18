import React from 'react';
import './ResultList.css';

export interface WikiArticle {
  id: string;
  title: string;
  description?: string;
  category?: string;
  url?: string;
}

interface ResultListProps {
  results: WikiArticle[];
  onSelect: (article: WikiArticle) => void;
}

export const ResultList: React.FC<ResultListProps> = ({ results, onSelect }) => {
  if (results.length === 0) {
    return (
      <div className="result-list empty">
        <p>No results found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="result-list">
      {results.map(article => (
        <div
          key={article.id}
          className="result-item"
          onClick={() => onSelect(article)}
        >
          <div className="result-content">
            <h3>{article.title}</h3>
            {article.description && <p>{article.description}</p>}
            {article.category && (
              <span className="result-category">{article.category}</span>
            )}
          </div>
          <span className="result-arrow">→</span>
        </div>
      ))}
    </div>
  );
};
