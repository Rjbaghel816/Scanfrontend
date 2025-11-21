import React, { useEffect, useRef } from 'react';
import CropOverlay from './CropOverlay';

const CameraPreview = ({
    stream,
    isProcessing,
    cameraReady,
    uploading,
    onCapture,
    captureBtnRef,
    cropMargins,
    onUpdateMargins,
    showCropUI,
    onSaveCrop,
    onResetCrop
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
                    <>
                        <div className="alignment-overlay">
                            <div className="center-line"></div>
                            <div className="grid-lines"></div>
                        </div>
                        {showCropUI && (
                            <CropOverlay
                                videoRef={videoRef}
                                stream={stream}
                                cropMargins={cropMargins}
                                onUpdateMargins={onUpdateMargins}
                                onSave={onSaveCrop}
                            />
                        )}
                    </>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="processing-overlay">
                        <div className="spinner"></div>
                        <p>Capturing Photo...</p>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
                {!isProcessing && (
                    <button
                        ref={captureBtnRef}
                        type="button"
                        className="capture-btn-large"
                        onClick={onCapture}
                        disabled={!cameraReady || uploading}
                        style={{ flex: 1 }}
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

                {!isProcessing && !showCropUI && (
                    <button
                        type="button"
                        onClick={onResetCrop}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '0 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '100px'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>✂️</span>
                        <span style={{ fontSize: '12px', marginTop: '4px' }}>Adjust Crop</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(CameraPreview);
