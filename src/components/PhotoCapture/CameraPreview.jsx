import React, { useEffect, useRef } from 'react';

const CameraPreview = ({
    stream,
    isProcessing,
    cameraReady,
    uploading,
    onCapture,
    captureBtnRef
}) => {
    const videoRef = useRef(null);

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="capture-main">
            <div className="camera-preview-container">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="live-camera-feed"
                    style={{ display: isProcessing ? 'none' : 'block' }}
                />
                {/* Alignment Guides */}
                {!isProcessing && (
                    <div className="alignment-overlay">
                        <div className="center-line"></div>
                        <div className="grid-lines"></div>
                    </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="processing-overlay">
                        <div className="spinner"></div>
                        <p>Capturing Photo...</p>
                    </div>
                )}
            </div>

            {!isProcessing && (
                <button
                    ref={captureBtnRef}
                    type="button"
                    className="capture-btn-large"
                    onClick={onCapture}
                    disabled={!cameraReady || uploading}
                >
                    <div className="camera-icon-large">📷</div>
                    <div className="capture-text">
                        {cameraReady
                            ? "Click to Capture Photo"
                            : "Camera Loading..."}
                    </div>
                    <div className="shortcut-hint">
                        {cameraReady ? "Or Press Enter Key" : "Please Wait"}
                    </div>
                </button>
            )}
        </div>
    );
};

export default React.memo(CameraPreview);
