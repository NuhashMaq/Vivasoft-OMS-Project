import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/rbac';

export const AIWiki: React.FC = () => {
  const { user } = useAuth();
  const canAccessAIWiki = hasPermission(user?.role, 'canAccessAIWiki');

  const articles = [
    { id: 1, title: 'Getting Started with AI', category: 'Basics' },
    { id: 2, title: 'Machine Learning Models', category: 'Advanced' },
    { id: 3, title: 'Natural Language Processing', category: 'Advanced' },
    { id: 4, title: 'Computer Vision 101', category: 'Basics' },
    { id: 5, title: 'Deep Learning Frameworks', category: 'Advanced' },
  ];

  return (
    <div>
      <h2>AI Wiki</h2>
      
      {/* FR-013: Super Admin access to AI knowledge base */}
      {canAccessAIWiki && user?.role === 'super_admin' && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#e8f5e9', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#2e7d32'
        }}>
          ✓ AI Wiki - Knowledge base for AI-driven insights and system intelligence
        </div>
      )}
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {articles.map(article => (
          <div key={article.id} style={{
            padding: '15px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            background: '#f9f9f9'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
            e.currentTarget.style.transform = 'translateX(5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f9f9f9';
            e.currentTarget.style.transform = 'translateX(0)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>📖 {article.title}</h3>
                <span style={{ 
                  fontSize: '12px', 
                  background: '#e3f2fd', 
                  color: '#1976d2',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {article.category}
                </span>
              </div>
              <span style={{ fontSize: '20px' }}>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
