import React from 'react';

const Header = ({ student, totalPages, isProcessing, uploading, hasNextStudent, onClose, onCapture }) => {
    return (
        <div className="capture-header">
            <div className="header-info">
                <h3>
                    📸 {student.rollNumber} - {student.name}
                </h3>
                <span className="pages-count">
                    {totalPages} pages
                    {isProcessing && " (Capturing...)"}
                    {uploading && " (Uploading...)"}
                </span>
                {hasNextStudent && (
                    <span className="next-student-indicator">
                        ⏭ Next student available
                    </span>
                )}
            </div>
            <div className="quick-actions">
                <button
                    type="button"
                    className="quick-btn"
                    onClick={onCapture}
                    disabled={isProcessing || uploading}
                    title="Take Photo (Enter)"
                >
                    📷
                </button>
                <button
                    type="button"
                    className="close-btn"
                    onClick={onClose}
                    title="Close (Esc)"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default React.memo(Header);
