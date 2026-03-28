import React from 'react';
import { Card } from '../../ui/Card';

export const StatsDashboard = ({ total, pending, completed, errors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card><h4 className="text-sm text-gray-500">Total Scans</h4><p className="text-2xl font-bold">{total || 0}</p></Card>
      <Card><h4 className="text-sm text-gray-500">Pending Evaluation</h4><p className="text-2xl font-bold text-blue-600">{pending || 0}</p></Card>
      <Card><h4 className="text-sm text-gray-500">Completed</h4><p className="text-2xl font-bold text-green-600">{completed || 0}</p></Card>
      <Card><h4 className="text-sm text-gray-500">Exceptions</h4><p className="text-2xl font-bold text-red-600">{errors || 0}</p></Card>
    </div>
  );
};
