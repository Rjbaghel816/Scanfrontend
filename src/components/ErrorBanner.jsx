import React from 'react';
import './ErrorBanner.css';

/**
 * ErrorBanner Component
 * Displays error messages with dismiss functionality
 * Also displays success messages (messages starting with ✅)
 */
const ErrorBanner = React.memo(({ error, onDismiss }) => {
  if (!error) return null;

  const isSuccess = error.startsWith('✅');
  const className = isSuccess ? 'error-banner success-banner' : 'error-banner';

  return (
    <div className={className}>
      <span>{error}</span>
      <button onClick={onDismiss} className="error-close" aria-label="Close message">
        ×
      </button>
    </div>
  );
});

ErrorBanner.displayName = 'ErrorBanner';

export default ErrorBanner;

