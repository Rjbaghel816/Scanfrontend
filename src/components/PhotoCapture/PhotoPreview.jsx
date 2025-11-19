import React from 'react';

const PhotoPreview = ({
    currentPhoto,
    pageNumber,
    isProcessing,
    uploading,
    onKeepAndAdd,
    onFinish,
    onRetake,
    keepAndAddRef,
    finishBtnRef
}) => {
    return (
        <div className="preview-mode fast-preview">
            <div className="photo-preview">
                <div className="image-container">
                    <img src={currentPhoto} alt="Captured" />
                    <div className="photo-badge">
                        Page {pageNumber}
                    </div>
                </div>
            </div>

            <div className="quick-actions-preview">
                <button
                    ref={keepAndAddRef}
                    type="button"
                    className="action-btn keep-add"
                    onClick={onKeepAndAdd}
                    disabled={isProcessing || uploading}
                >
                    ➕ Keep & Next (Enter/A)
                </button>
                <button
                    ref={finishBtnRef}
                    type="button"
                    className="action-btn finish"
                    onClick={onFinish}
                    disabled={uploading}
                >
                    {uploading ? "⏳ Uploading..." : "📄 Finish & Save (K/F)"}
                </button>
                <button
                    type="button"
                    className="action-btn retake"
                    onClick={onRetake}
                    disabled={uploading}
                >
                    🔄 Retake (R)
                </button>
            </div>
        </div>
    );
};

export default React.memo(PhotoPreview);
