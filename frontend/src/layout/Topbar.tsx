import React from 'react';
import { useAuth } from '../auth/AuthContext';
import './Topbar.css';

export const Topbar: React.FC = () => {
  const [searchValue, setSearchValue] = React.useState('');
  const { user } = useAuth();

  return (
    <div className="topbar">
      <div className="topbar-container">
        <div className="topbar-search">
          <input
            type="text"
            placeholder="🔍 Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="topbar-profile">
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div className="profile-info">
            <p className="profile-name">{user?.name || 'Guest'}</p>
            <p className="profile-role">{user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
