import React, { useMemo } from "react";
import "./ClassSelector.css";

/**
 * ClassSelector Component
 * Handles class selection and creation
 * Memoized to prevent unnecessary re-renders
 */
const ClassSelector = React.memo(
  ({
    currentClass,
    availableClasses,
    newClassName,
    onClassChange,
    onNewClassNameChange,
    onCreateNewClass,
    onFindClass,
  }) => {
    const [searchCode, setSearchCode] = React.useState("");

    const handleSearch = () => {
      if (searchCode.trim()) {
        onFindClass(searchCode.trim());
        setSearchCode("");
      }
    };

    return (
      <div className="class-selector">
        {/* Class Search/Find */}
        <div className="class-selector-group search-group">
          <label className="class-label">🔍 Find Class by Code:</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Enter class code (e.g. mj5hind4)"
              className="class-name-input"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <button
              onClick={handleSearch}
              disabled={!searchCode.trim()}
              className="find-class-btn"
            >
              Find
            </button>
          </div>
        </div>

        {/* Existing Classes */}
        <div className="class-selector-group">
          <label className="class-label">📚 Select from Recent:</label>
          <select
            value={currentClass}
            onChange={(e) => onClassChange(e.target.value)}
            className="class-select"
          >
            <option value="default">-- Select a Class --</option>
            {availableClasses.map((cls) => (
              <option key={cls.collectionName} value={cls.className}>
                {cls.displayName}
              </option>
            ))}
          </select>
          <span className="class-count">
            {availableClasses.length} classes listed
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
              placeholder="Enter exact class code"
              className="class-name-input"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
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
              Create
            </button>
          </div>
          <div className="class-hint">
            💡 Collection will be created with the exact code entered.
          </div>
        </div>

        {/* Current Class Info */}
        {currentClass && currentClass !== "default" && (
          <div className="current-class-info">
            <span className="current-class-badge">
              🎯 Currently Viewing:{" "}
              <strong>{currentClass.toUpperCase()}</strong>
            </span>
          </div>
        )}
      </div>
    );
  }
);

ClassSelector.displayName = "ClassSelector";

export default ClassSelector;
