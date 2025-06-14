import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Header 
        onSearch={(query) => {}}
        onFilter={() => {}}
        onExport={() => {}}
      />
      <div className="app-content">
        <main className="canvas-container">
          {children}
        </main>
        <Sidebar />
      </div>
    </div>
  );
};