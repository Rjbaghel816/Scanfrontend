import React from 'react';

const MiniGallery = ({ photos, onRemove, disabled }) => {
    if (!photos || photos.length === 0) return null;

    return (
        <div className="photos-grid-mini">
            <p className="mini-photos-title">Captured Pages:</p>
            <div className="mini-photos-container">
                {photos.slice(-4).map((photo) => (
                    <div key={photo.id} className="mini-photo">
                        <img
                            src={photo.data}
                            alt={`Page ${photo.pageNumber}`}
                        />
                        <span className="mini-page-no">{photo.pageNumber}</span>
                        <button
                            type="button"
                            className="mini-remove"
                            onClick={() => onRemove(photo.id)}
                            title="Remove this page"
                            disabled={disabled}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(MiniGallery);
