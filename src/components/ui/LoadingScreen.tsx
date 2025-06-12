/**
 * Loading screen component for TM8 application
 * Shows loading state with progress indication
 */

import React from 'react';
import './LoadingScreen.css';

export interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showSpinner?: boolean;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  progress,
  showSpinner = true,
  className = ''
}) => {
  return (
    <div className={`loading-screen ${className}`}>
      <div className="loading-content">
        {showSpinner && (
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        )}
        
        <div className="loading-text">
          <h2 className="loading-title">TM8 Threat Modeler</h2>
          <p className="loading-message">{message}</p>
        </div>
        
        {progress !== undefined && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <span className="progress-text">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;