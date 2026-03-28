import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

export const CopyManagementAdvanced = ({ onSearch, filters, onFilterChange, children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (onSearch) onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="copy-management-wrapper bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm mb-4">
      <div className="flex gap-4 mb-4">
        <input 
          type="text"
          placeholder="Search by fictitious number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full max-w-sm"
        />
        <select 
          value={filters?.status || ''} 
          onChange={(e) => onFilterChange && onFilterChange({ ...filters, status: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="evaluated">Evaluated</option>
        </select>
      </div>
      <div className="legacy-content-projection">
        {children}
      </div>
    </div>
  );
};
