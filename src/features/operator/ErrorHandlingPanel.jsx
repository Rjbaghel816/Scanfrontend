import React from 'react';
import { Card } from '../../ui/Card';

export const ErrorHandlingPanel = ({ exceptions = [], onFix }) => {
  return (
    <Card title="Exception & Error Resolution">
      {exceptions.length === 0 ? (
        <p className="text-gray-500">No pending exceptions.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {exceptions.map(err => (
            <li key={err.id} className="py-3 flex justify-between items-center">
              <div>
                <span className={`px-2 py-1 text-xs rounded-full mr-3 ${err.type === 'LOW_PAGE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {err.type}
                </span>
                <span className="text-sm font-medium">{err.copyNumber}</span> - <span className="text-sm text-gray-500">{err.message}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onFix(err.id, 'accept')} className="text-sm px-3 py-1 bg-green-500 text-white rounded">Accept</button>
                <button onClick={() => onFix(err.id, 're-upload')} className="text-sm px-3 py-1 bg-blue-500 text-white rounded">Re-upload</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
