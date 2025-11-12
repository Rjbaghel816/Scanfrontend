import React from 'react';
import './ClassSelector.css';

const ClassSelector = ({
  currentClass,
  availableClasses,
  newClassName,
  onClassChange,
  onNewClassNameChange,
  onCreateNewClass
}) => {
  return (
    <div className="class-selector">
      {/* Existing Classes */}
      <div className="class-selector-group">
        <label className="class-label">📚 Select Existing Class:</label>
        <select 
          value={currentClass} 
          onChange={(e) => onClassChange(e.target.value)}
          className="class-select"
        >
          <option value="default">-- Select a Class --</option>
          {availableClasses.map((cls) => (
            <option key={cls.collectionName} value={cls.className}>
              {cls.displayName} ({cls.collectionName})
            </option>
          ))}
        </select>
        <span className="class-count">
          {availableClasses.length} classes available
        </span>
      </div>

      {/* Class Creator */}
      <div className="class-creator">
        <label className="class-label">➕ Create New Class:</label>
        <div className="create-class-input">
          <input
            type="text"
            value={newClassName}
            onChange={(e) => onNewClassNameChange(e.target.value)}
            placeholder="Enter class name (e.g., 12th Science A, B.Com 2nd Year)"
            className="class-name-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onCreateNewClass();
              }
            }}
          />
          <button 
            onClick={onCreateNewClass}
            disabled={!newClassName.trim()}
            className="create-class-btn"
            title="Create new class collection"
          >
            Create Class
          </button>
        </div>
        <div className="class-hint">
          💡 Class name will be converted to collection name (e.g., "12th Science A" → "class_12th_science_a")
        </div>
      </div>

      {/* Current Class Info */}
      {currentClass && currentClass !== 'default' && (
        <div className="current-class-info">
          <span className="current-class-badge">
            🎯 Currently Viewing: <strong>{currentClass.replace(/_/g, ' ').toUpperCase()}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default ClassSelector;