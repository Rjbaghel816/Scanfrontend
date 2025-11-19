import React from 'react';

const StatusActions = ({
    onMarkAsAbsent,
    onMarkAsMissing,
    onFinish,
    onNextStudent,
    capturedPhotos,
    hasNextStudent,
    uploading
}) => {
    return (
        <div className="bottom-actions">
            <div className="status-buttons-bottom">
                <button
                    type="button"
                    className="status-btn absent-btn"
                    onClick={onMarkAsAbsent}
                    disabled={uploading}
                >
                    ❌ Mark Absent
                </button>
                <button
                    type="button"
                    className="status-btn missing-btn"
                    onClick={onMarkAsMissing}
                    disabled={uploading}
                >
                    📝 Mark Missing
                </button>
            </div>

            {capturedPhotos && capturedPhotos.length > 0 && (
                <button
                    type="button"
                    className="finish-btn-mini"
                    onClick={onFinish}
                    disabled={uploading}
                >
                    {uploading
                        ? "⏳ Uploading..."
                        : `📄 Finish (${capturedPhotos.length} pages)`}
                </button>
            )}

            {hasNextStudent && (
                <button
                    type="button"
                    className="next-student-btn-mini"
                    onClick={onNextStudent}
                    disabled={uploading}
                >
                    ⏭ Next Student
                </button>
            )}
        </div>
    );
};

export default React.memo(StatusActions);
