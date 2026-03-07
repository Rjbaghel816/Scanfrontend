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
    onResetCrop,
    setVideoElement,
    copyNumber,
    onCopyNumberChange,
    isCopyNumberValid
}) => {
    const videoRef = useRef(null);
    const copyNumberInputRef = useRef(null);

    // Auto-focus copy number input when camera is ready and no photo is being processed
    useEffect(() => {
        if (!isProcessing && cameraReady && copyNumberInputRef.current && !copyNumber) {
            const timeout = setTimeout(() => {
                copyNumberInputRef.current?.focus();
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [cameraReady, isProcessing, copyNumber]);

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
                    ref={(el) => {
                        videoRef.current = el;
                        if (setVideoElement) setVideoElement(el);
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="live-camera-feed"
                    style={{
                        opacity: isProcessing ? 0 : 1,
                        position: isProcessing ? 'absolute' : 'relative'
                    }}
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

            <div className="capture-controls-wrapper">
                {!isProcessing && (
                    <div className="copy-number-input-wrapper">
                        <label htmlFor="copy-number-input" className="copy-number-label">
                            Copy Number
                        </label>
                        <input
                            ref={copyNumberInputRef}
                            id="copy-number-input"
                            type="text"
                            className="copy-number-input"
                            placeholder="Enter copy number"
                            value={copyNumber || ''}
                            onChange={(e) => onCopyNumberChange?.(e.target.value)}
                            disabled={uploading}
                            autoComplete="off"
                        />
                    </div>
                )}

                <div className="capture-controls-row">
                    {!isProcessing && (
                        <button
                            ref={captureBtnRef}
                            type="button"
                            className="capture-btn-large"
                            onClick={onCapture}
                            disabled={!cameraReady || uploading || !isCopyNumberValid}
                            style={{ flex: 1 }}
                        >
                            <div className="camera-icon-large">📷</div>
                            <div className="capture-text">
                                {cameraReady
                                    ? isCopyNumberValid
                                        ? "Click to Capture Photo"
                                        : "Enter Copy Number First"
                                    : "Camera Loading..."}
                            </div>
                            <div className="shortcut-hint">
                                {cameraReady && isCopyNumberValid ? "Or Press Enter Key" : "Please Wait"}
                            </div>
                        </button>
                    )}

                    {!isProcessing && !showCropUI && (
                        <button
                            type="button"
                            onClick={onResetCrop}
                            className="crop-adjust-btn"
                        >
                            <span style={{ fontSize: '20px' }}>✂️</span>
                            <span style={{ fontSize: '12px', marginTop: '4px' }}>Adjust Crop</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(CameraPreview);
