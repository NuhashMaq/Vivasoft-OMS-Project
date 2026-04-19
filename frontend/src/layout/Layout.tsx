import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';
import './Layout.css';
import './Sidebar.css';

export const Layout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <main className="layout-content">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};