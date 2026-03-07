import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useCamera } from "../hooks/useCamera";
import { useCopyNumber } from "../hooks/useCopyNumber";
import { usePhotoCapture } from "../hooks/usePhotoCapture";
import "./PhotoCapture.css";

/**
 * PhotoCapture Component
 * Handles photo capture for student exam copies with camera integration
 * Optimized with custom hooks and memoization
 */
const PhotoCapture = React.memo(
  ({
    student,
    capturedPhotos = [],
    onPhotosUpdate,
    onFinish,
    onClose,
    onNextStudent,
    onMarkAsAbsent,
    onMarkAsMissing,
    hasNextStudent,
  }) => {
    // Refs for focus management
    const videoRef = useRef(null);
    
    // Custom hooks
    const camera = useCamera();
    const copyNumberHook = useCopyNumber();
    const { copyNumber, isValid: isCopyNumberValid, updateCopyNumber } = copyNumberHook;
    
    // Use custom photo capture hook
    const {
      state: { currentPhoto, isProcessing, uploading },
      actions: {
        handleTakePhoto,
        handleKeepAndAddMore,
        handleRetake,
        handleFinishSession,
        handleRemovePhoto,
        handleNextStudentAction,
      },
      refs: { captureBtnRef, keepAndAddRef },
    } = usePhotoCapture(
      { student, capturedPhotos, onPhotosUpdate, onFinish, onClose, onNextStudent, hasNextStudent },
      camera,
      copyNumberHook
    );

    // Destructure camera
    const { stream, cameraReady, cameraError, retryCamera } = camera;

    // Memoized student data
    const studentData = useMemo(
      () =>
        student || {
          rollNumber: "Unknown",
          name: "Unknown Student",
        },
      [student]
    );

    // Memoized total pages count
    const totalPages = useMemo(
      () => (capturedPhotos?.length || 0) + (currentPhoto ? 1 : 0),
      [capturedPhotos, currentPhoto]
    );

    // Keyboard shortcuts handler
    const handleKeyPress = useCallback(
      (e) => {
        if (
          e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.tagName === "SELECT"
        ) {
          return;
        }

        const activeElement = document.activeElement;
        const isFocusOnButton = activeElement?.tagName === "BUTTON";

        if (isFocusOnButton && e.key === "Enter") {
          return;
        }

        if (
          ["r", "R", "k", "K", "f", "F", "a", "A", "n", "N", "Escape"].includes(
            e.key
          )
        ) {
          e.preventDefault();
        }

        switch (e.key) {
          case "Enter":
            if (!isFocusOnButton) {
              if (!currentPhoto && !isProcessing && cameraReady && isCopyNumberValid) {
                handleTakePhoto();
              } else if (currentPhoto) {
                handleKeepAndAddMore();
              }
            }
            break;
          case "r":
          case "R":
            if (currentPhoto) handleRetake();
            break;
          case "k":
          case "K":
          case "f":
          case "F":
            if ((capturedPhotos?.length || 0) > 0 || currentPhoto) {
              handleFinishSession();
            }
            break;
          case "a":
          case "A":
            if (currentPhoto) handleKeepAndAddMore();
            break;
          case "n":
          case "N":
            if (hasNextStudent && !uploading) {
              handleNextStudentAction();
            }
            break;
          case "Escape":
            if (onClose) onClose();
            break;
          default:
            break;
        }
      },
      [
        currentPhoto,
        isProcessing,
        cameraReady,
        isCopyNumberValid,
        capturedPhotos,
        uploading,
        hasNextStudent,
        handleTakePhoto,
        handleKeepAndAddMore,
        handleRetake,
        handleFinishSession,
        handleNextStudentAction,
        onClose,
      ]
    );

    // Auto-focus management
    useEffect(() => {
      const timeout = setTimeout(() => {
        if (currentPhoto && keepAndAddRef.current) {
          keepAndAddRef.current.focus();
        } else if (!currentPhoto && captureBtnRef.current && cameraReady && isCopyNumberValid) {
          captureBtnRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timeout);
    }, [currentPhoto, cameraReady, isCopyNumberValid]);

    // Attach stream to video element
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    // Keyboard event listener
    useEffect(() => {
      document.addEventListener("keydown", handleKeyPress);
      return () => {
        document.removeEventListener("keydown", handleKeyPress);
      };
    }, [handleKeyPress]);

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
          <div className="capture-header">
            <div className="header-info">
              <h3>
                📸 {studentData.rollNumber} - {studentData.name}
              </h3>
              <div className="copy-number-input-container">
                <label htmlFor="copyNumber">Copy Number:</label>
                <input
                  id="copyNumber"
                  type="text"
                  value={copyNumber}
                  onChange={(e) => updateCopyNumber(e.target.value)}
                  placeholder="Enter copy number"
                  disabled={uploading || isProcessing}
                  className={!isCopyNumberValid && copyNumber ? "copy-number-error" : ""}
                  maxLength={10}
                />
                {!isCopyNumberValid && copyNumber && (
                  <span className="error-message">Copy number is required</span>
                )}
              </div>
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
                onClick={handleTakePhoto}
                disabled={isProcessing || !cameraReady || uploading || !isCopyNumberValid}
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
              <div className="preview-mode fast-preview">
                <div className="photo-preview">
                  <div className="image-container">
                    <img src={currentPhoto} alt="Captured" />
                    <div className="photo-badge">
                      Page {(capturedPhotos?.length || 0) + 1}
                    </div>
                  </div>
                </div>

                <div className="quick-actions-preview">
                  <button
                    ref={keepAndAddRef}
                    type="button"
                    className="action-btn keep-add"
                    onClick={handleKeepAndAddMore}
                    disabled={isProcessing || uploading || !isCopyNumberValid}
                  >
                    ➕ Keep & Next (Enter/A)
                  </button>
                  <button
                    type="button"
                    className="action-btn finish"
                    onClick={handleFinishSession}
                    disabled={uploading || !isCopyNumberValid}
                  >
                    {uploading ? "⏳ Uploading..." : "📄 Finish & Save (K/F)"}
                  </button>
                  <button
                    type="button"
                    className="action-btn retake"
                    onClick={handleRetake}
                    disabled={uploading}
                  >
                    🔄 Retake (R)
                  </button>
                </div>
              </div>
            ) : (
              <div className="capture-mode fast-capture-ui">
                {!cameraReady && !cameraError && (
                  <div className="camera-status">
                    <div className="spinner"></div>
                    <p>Initializing camera... Please wait</p>
                  </div>
                )}

                {cameraReady && !isCopyNumberValid && (
                  <div className="copy-number-warning">
                    <div className="warning-icon">⚠️</div>
                    <p>Please enter copy number before capturing photos</p>
                  </div>
                )}

                {cameraReady && isCopyNumberValid && (
                  <div className="camera-ready-indicator">
                    <div className="camera-icon">📷</div>
                    <p>Camera Ready - Point at document and click capture</p>
                  </div>
                )}

                {capturedPhotos && capturedPhotos.length > 0 && (
                  <div className="photos-grid-mini">
                    <p className="mini-photos-title">Captured Pages:</p>
                    <div className="mini-photos-container">
                      {capturedPhotos.slice(-4).map((photo) => (
                        <div key={photo.id} className="mini-photo">
                          <img
                            src={photo.data}
                            alt={`Page ${photo.pageNumber}`}
                          />
                          <span className="mini-page-no">
                            {photo.pageNumber}
                          </span>
                          <button
                            type="button"
                            className="mini-remove"
                            onClick={() => handleRemovePhoto(photo.id)}
                            title="Remove this page"
                            disabled={uploading}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="capture-main">
                  <div className="camera-preview-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="live-camera-feed"
                      style={{ display: isProcessing ? "none" : "block" }}
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
                      onClick={handleTakePhoto}
                      disabled={!cameraReady || uploading || !isCopyNumberValid}
                    >
                      <div className="camera-icon-large">📷</div>
                      <div className="capture-text">
                        {!isCopyNumberValid
                          ? "Enter Copy Number First"
                          : cameraReady
                          ? "Click to Capture Photo"
                          : "Camera Loading..."}
                      </div>
                      <div className="shortcut-hint">
                        {cameraReady && isCopyNumberValid
                          ? "Or Press Enter Key"
                          : !isCopyNumberValid
                          ? "Enter copy number above"
                          : "Please Wait"}
                      </div>
                    </button>
                  )}
                </div>

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
                      onClick={handleFinishSession}
                      disabled={uploading || !isCopyNumberValid}
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
                      onClick={handleNextStudentAction}
                      disabled={uploading}
                    >
                      ⏭ Next Student
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="shortcuts-help">
            <span>
              {cameraError
                ? "Camera unavailable. Please ensure camera permissions are granted."
                : `Shortcuts: Enter=Capture/Keep & Next, R=Retake, K/F=Finish & Save, A=Keep & Next${
                    hasNextStudent ? ", N=Next Student" : ""
                  }, Esc=Close`}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PhotoCapture.displayName = "PhotoCapture";

export default PhotoCapture;