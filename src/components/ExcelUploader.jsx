import React, { useMemo } from 'react';
import './ExcelUploader.css';

const ExcelUploader = React.memo(({
    currentClass,
    currentSubject,
    availableSubjects,
    onSubjectChange,
    onExcelUpload,
    isUploading,
    onAddSubject
}) => {
    const [newSubject, setNewSubject] = React.useState('');
    const [showAddSubject, setShowAddSubject] = React.useState(false);

    const handleAddSubject = () => {
        if (newSubject.trim()) {
            onAddSubject(newSubject.trim());
            setNewSubject('');
            setShowAddSubject(false);
        }
    };

    const classDisplayName = useMemo(() => {
        if (!currentClass || currentClass === 'default') return 'Not Selected';
        return currentClass.replace(/_/g, ' ');
    }, [currentClass]);

    const isUploadDisabled = !currentClass || currentClass === 'default' || !currentSubject || isUploading;

    const handleUploadClick = (e) => {
        if (isUploadDisabled) {
            e.preventDefault();
            if (!currentClass || currentClass === 'default') {
                alert("Please select a Class from the top menu first!");
            } else if (!currentSubject) {
                alert("Please select a Subject from the dropdown first!");
            }
            return;
        }
        // If label click naturally triggers the input, this will just pass through
    };

    return (
        <div className="excel-uploader-container">
            <div className="selection-group">
                <div className="class-info-badge">
                    🎯 Class: <strong>{classDisplayName}</strong>
                </div>

                <div className="subject-selector">
                    <label>📝 Subject:</label>
                    <div className="subject-input-group">
                        <select
                            value={currentSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            disabled={!currentClass || currentClass === 'default'}
                            className="subject-select"
                        >
                            <option value="">-- Select Subject --</option>
                            {availableSubjects.map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                        <button 
                            type="button"
                            className="add-subject-toggle"
                            onClick={() => setShowAddSubject(!showAddSubject)}
                            disabled={!currentClass || currentClass === 'default'}
                            title="Add Custom Subject"
                        >
                            {showAddSubject ? '✕' : '➕'}
                        </button>
                    </div>

                    {showAddSubject && (
                        <div className="add-subject-popover">
                            <input 
                                type="text"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                placeholder="Enter Subject Code (e.g. BTC101)"
                                className="new-subject-input"
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                            />
                            <button 
                                onClick={handleAddSubject}
                                disabled={!newSubject.trim()}
                                className="confirm-add-subject"
                            >
                                Add
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="upload-action">
                {/* To ensure the click works, we wrap the visual button in a label bound to the hidden input */}
                <label
                    htmlFor="excel-upload-input"
                    className={`excel-upload-btn ${isUploadDisabled ? 'disabled' : ''}`}
                    title="Upload Excel file with Roll Numbers"
                    onClick={handleUploadClick}
                    style={{ 
                        cursor: isUploadDisabled ? 'not-allowed' : 'pointer',
                        display: 'inline-block',
                        textAlign: 'center'
                    }}
                >
                    {isUploading ? '⏳ Uploading...' : '📊 Upload Excel File'}
                </label>
                <input
                    id="excel-upload-input"
                    type="file"
                    onChange={onExcelUpload}
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                />
            </div>
            
            <div className="upload-hint">
                {(!currentClass || currentClass === 'default') && "Select Class first. "}
                {(currentClass && currentClass !== 'default' && !currentSubject) && "Select Subject to enable upload. "}
            </div>
        </div>
    );
});

ExcelUploader.displayName = 'ExcelUploader';

export default ExcelUploader;
