import React from 'react';
import { WikiArticle } from './ResultList';
import './WikiViewer.css';

interface WikiViewerProps {
  article: WikiArticle;
  onBack: () => void;
}

export const WikiViewer: React.FC<WikiViewerProps> = ({ article, onBack }) => {
  return (
    <div className="wiki-viewer">
      <button className="back-btn" onClick={onBack}>
        ← Back to Results
      </button>

      <div className="viewer-content">
        <div className="viewer-header">
          <h1>{article.title}</h1>
          {article.category && (
            <span className="viewer-category">{article.category}</span>
          )}
        </div>

        <div className="viewer-body">
          {article.description ? (
            <div>
              <section>
                <h2>Overview</h2>
                <p>{article.description}</p>
              </section>

              <section>
                <h2>Details</h2>
                <p>
                  This is a placeholder for detailed content. The actual content
                  will be populated from the backend wiki service.
                </p>
              </section>
            </div>
          ) : (
            <p>No content available for this article.</p>
          )}
        </div>

        {article.url && (
          <div className="viewer-footer">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="view-link">
              View Full Article →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
