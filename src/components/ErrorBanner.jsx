import React from 'react';
import './ErrorBanner.css';

/**
 * ErrorBanner Component
 * Displays error messages with dismiss functionality
 */
const ErrorBanner = React.memo(({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="error-banner">
      <span>❌ {error}</span>
      <button onClick={onDismiss} className="error-close" aria-label="Close error">
        ×
      </button>
    </div>
  );
});

ErrorBanner.displayName = 'ErrorBanner';

export default ErrorBanner;

