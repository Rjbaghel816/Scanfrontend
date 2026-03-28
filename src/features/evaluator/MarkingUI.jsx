import React, { useState } from 'react';
import { Card } from '../../ui/Card';

export const MarkingUI = ({ maxMarks, currentMarks, onSaveMarks }) => {
  const [marks, setMarks] = useState(currentMarks || '');

  const handleBlur = () => {
    if (marks !== '' && !isNaN(marks) && Number(marks) <= maxMarks && Number(marks) >= 0) {
      if (onSaveMarks) onSaveMarks(Number(marks));
    }
  };

  return (
    <Card className="w-64 shadow-xl border-l-4 border-blue-500 z-50">
      <h3 className="font-bold mb-2">Assign Marks</h3>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={marks} 
          onChange={(e) => setMarks(e.target.value)}
          onBlur={handleBlur}
          className="border rounded w-full p-2 text-xl font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="0"
          max={maxMarks}
          min={0}
        />
        <span className="text-gray-500 font-bold whitespace-nowrap">/ {maxMarks}</span>
      </div>
      <p className="text-xs text-gray-400 mt-2">Auto-saves on blur</p>
    </Card>
  );
};
