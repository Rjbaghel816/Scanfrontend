import React, { useEffect, useMemo } from "react";
import { useCamera } from "../../hooks/useCamera";
import { usePhotoCapture } from "../../hooks/usePhotoCapture";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import Header from "./Header";
import CameraPreview from "./CameraPreview";
import PhotoPreview from "./PhotoPreview";
import MiniGallery from "./MiniGallery";
import StatusActions from "./StatusActions";
import ShortcutsHelp from "./ShortcutsHelp";
import "./PhotoCapture.css";

/**
 * PhotoCapture Component
 * Handles photo capture for student exam copies with camera integration
 * Refactored for better performance and maintainability
 */
const PhotoCapture = React.memo((props) => {
    const {
        student,
        capturedPhotos,
        onClose,
        hasNextStudent,
        onMarkAsAbsent,
        onMarkAsMissing,
        onFinish,
        onNextStudent
    } = props;

    // Custom hooks
    const camera = useCamera();
    const { state, actions, refs } = usePhotoCapture(props, camera);

    const { currentPhoto, isProcessing, uploading } = state;
    const {
        handleTakePhoto,
        handleKeepAndAddMore,
        handleRetake,
        handleFinishSession,
        handleRemovePhoto,
        handleNextStudentAction
    } = actions;
    const { captureBtnRef, keepAndAddRef } = refs;

    const { cameraReady, cameraError, setupCamera, retryCamera, stream } = camera;

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onCapture: handleTakePhoto,
        onRetake: handleRetake,
        onFinish: handleFinishSession,
        onKeepAndAdd: handleKeepAndAddMore,
        onNextStudent: handleNextStudentAction,
        onClose
    }, {
        currentPhoto,
        isProcessing,
        cameraReady,
        capturedPhotos,
        uploading,
        hasNextStudent
    });

    // Camera initialization
    useEffect(() => {
        let mounted = true;
        const initCamera = async () => {
            try {
                await setupCamera();
            } catch (error) {
                if (mounted) console.error("Failed to initialize camera:", error);
            }
        };
        initCamera();
        return () => { mounted = false; };
    }, [setupCamera]);

    // Auto-focus management
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (currentPhoto && keepAndAddRef.current) {
                keepAndAddRef.current.focus();
            } else if (!currentPhoto && captureBtnRef.current && cameraReady) {
                captureBtnRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [currentPhoto, cameraReady, keepAndAddRef, captureBtnRef]);

    // Memoized derived state
    const studentData = useMemo(() => student || {
        rollNumber: "Unknown",
        name: "Unknown Student",
    }, [student]);

    const totalPages = useMemo(() =>
        (capturedPhotos?.length || 0) + (currentPhoto ? 1 : 0),
        [capturedPhotos, currentPhoto]
    );

    if (!studentData) {
        return (
            <div className="photo-capture-overlay">
                <div className="photo-capture-modal">
                    <div style={{ padding: "20px", textAlign: "center" }}>
                        <h3>Error: No student data provided</h3>
                        <button onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="photo-capture-overlay">
            <div className="photo-capture-modal fast-capture">
                <Header
                    student={studentData}
                    totalPages={totalPages}
                    isProcessing={isProcessing}
                    uploading={uploading}
                    hasNextStudent={hasNextStudent}
                    onClose={onClose}
                    onCapture={handleTakePhoto}
                />

                <div className="capture-content">
                    {cameraError ? (
                        <div className="camera-error">
                            <div className="error-icon">📷</div>
                            <h3>Camera Not Available</h3>
                            <p>{cameraError}</p>
                            <div className="camera-error-actions">
                                <button
                                    className="retry-camera-btn"
                                    onClick={retryCamera}
                                    disabled={uploading}
                                >
                                    🔄 Retry Camera
                                </button>
                            </div>
                        </div>
                    ) : currentPhoto ? (
                        <PhotoPreview
                            currentPhoto={currentPhoto}
                            pageNumber={(capturedPhotos?.length || 0) + 1}
                            isProcessing={isProcessing}
                            uploading={uploading}
                            onKeepAndAdd={handleKeepAndAddMore}
                            onFinish={handleFinishSession}
                            onRetake={handleRetake}
                            keepAndAddRef={keepAndAddRef}
                        />
                    ) : (
                        <div className="capture-mode fast-capture-ui">
                            {!cameraReady && !cameraError && (
                                <div className="camera-status">
                                    <div className="spinner"></div>
                                    <p>Initializing camera... Please wait</p>
                                </div>
                            )}

                            {cameraReady && (
                                <div className="camera-ready-indicator">
                                    <div className="camera-icon">📷</div>
                                    <p>Camera Ready - Point at document and click capture</p>
                                </div>
                            )}

                            <MiniGallery
                                photos={capturedPhotos}
                                onRemove={handleRemovePhoto}
                                disabled={uploading}
                            />

                            <CameraPreview
                                stream={stream}
                                isProcessing={isProcessing}
                                cameraReady={cameraReady}
                                uploading={uploading}
                                onCapture={handleTakePhoto}
                                captureBtnRef={captureBtnRef}
                            />

                            <StatusActions
                                onMarkAsAbsent={onMarkAsAbsent}
                                onMarkAsMissing={onMarkAsMissing}
                                onFinish={handleFinishSession}
                                onNextStudent={handleNextStudentAction}
                                capturedPhotos={capturedPhotos}
                                hasNextStudent={hasNextStudent}
                                uploading={uploading}
                            />
                        </div>
                    )}
                </div>

                <ShortcutsHelp
                    cameraError={cameraError}
                    hasNextStudent={hasNextStudent}
                />
            </div>
        </div>
    );
});

PhotoCapture.displayName = 'PhotoCapture';

export default PhotoCapture;
