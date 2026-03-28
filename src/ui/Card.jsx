import React from 'react';
import './ui.css';

export const Card = ({ children, title, className = '', action }) => {
  return (
    <div className={`ui-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          {title && <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
