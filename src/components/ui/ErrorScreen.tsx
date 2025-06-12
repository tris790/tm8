/**
 * Error screen component for TM8 application
 * Shows error states with recovery options
 */

import React from 'react';
import './ErrorScreen.css';

export interface ErrorScreenProps {
  error: string | Error;
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  retryLabel?: string;
  homeLabel?: string;
  showDetails?: boolean;
  className?: string;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  title = 'Something went wrong',
  subtitle = 'We encountered an unexpected error.',
  onRetry,
  onGoHome,
  retryLabel = 'Try again',
  homeLabel = 'Go home',
  showDetails = false,
  className = ''
}) => {
  const [showFullError, setShowFullError] = React.useState(false);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.currentTarget.getAttribute('data-action') === 'retry') {
        onRetry?.();
      } else if (e.currentTarget.getAttribute('data-action') === 'home') {
        onGoHome?.();
      }
    }
  };

  return (
    <div className={`error-screen ${className}`}>
      <div className="error-content">
        <div className="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        
        <div className="error-text">
          <h1 className="error-title">{title}</h1>
          <p className="error-subtitle">{subtitle}</p>
          
          {showDetails && (
            <div className="error-details">
              <div className="error-message">
                <strong>Error:</strong> {errorMessage}
              </div>
              
              {errorStack && (
                <details className="error-stack">
                  <summary 
                    className="error-stack-toggle"
                    onClick={() => setShowFullError(!showFullError)}
                  >
                    {showFullError ? 'Hide' : 'Show'} technical details
                  </summary>
                  <pre className="error-stack-content">{errorStack}</pre>
                </details>
              )}
            </div>
          )}
        </div>
        
        <div className="error-actions">
          {onRetry && (
            <button 
              className="error-action error-action--primary"
              onClick={onRetry}
              onKeyDown={handleKeyDown}
              data-action="retry"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {retryLabel}
            </button>
          )}
          
          {onGoHome && (
            <button 
              className="error-action error-action--secondary"
              onClick={onGoHome}
              onKeyDown={handleKeyDown}
              data-action="home"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              {homeLabel}
            </button>
          )}
        </div>
        
        {!showDetails && (
          <button 
            className="error-details-toggle"
            onClick={() => setShowFullError(!showFullError)}
          >
            Show technical details
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorScreen;