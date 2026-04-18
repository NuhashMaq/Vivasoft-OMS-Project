import React from 'react';
import './Loader.css';

export const Loader: React.FC = () => {
  return (
    <div className="loader">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
};
