import React from 'react';

export const RemarksSystem = ({ onAddRemark }) => {
  const predefinedRemarks = ["Unclear handwriting", "Excellent approach", "Formula missing", "Calculation error", "Step missing"];
  
  return (
    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-100">
      <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Quick Remarks (Drag or Click)</h4>
      <div className="flex flex-wrap gap-2">
        {predefinedRemarks.map((remark, idx) => (
          <button 
            key={idx}
            onClick={() => onAddRemark && onAddRemark(remark)}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('remark', remark)}
            className="text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-600 transition-colors"
          >
            {remark}
          </button>
        ))}
      </div>
    </div>
  );
};
