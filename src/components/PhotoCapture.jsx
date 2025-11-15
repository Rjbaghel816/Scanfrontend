import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useCamera } from "../hooks/useCamera";
import "./PhotoCapture.css";

/**
 * PhotoCapture Component
 * Handles photo capture for student exam copies with camera integration
 * Optimized with custom hooks and memoization
 */
const PhotoCapture = React.memo(({
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
  const keepAndAddRef = useRef(null);
  const finishBtnRef = useRef(null);
  const captureBtnRef = useRef(null);

  // Local state
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Use custom camera hook
  const { 
    stream, 
    cameraReady, 
    cameraError, 
    setupCamera, 
    capturePhoto, 
    retryCamera 
  } = useCamera();

  // Memoized student data
  const studentData = useMemo(() => student || {
    rollNumber: "Unknown",
    name: "Unknown Student",
  }, [student]);

  // Memoized total pages count
  const totalPages = useMemo(() => 
    (capturedPhotos?.length || 0) + (currentPhoto ? 1 : 0),
    [capturedPhotos, currentPhoto]
  );

  // Photo capture handler
  const handleTakePhoto = useCallback(async () => {
    if (isProcessing || !cameraReady) return;

    try {
      setIsProcessing(true);
      const photoData = await capturePhoto();
      if (photoData) {
        setCurrentPhoto(photoData);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, cameraReady, capturePhoto]);

  // Add current photo to captured list
  const addCurrentPhotoToCaptured = useCallback(() => {
    if (!currentPhoto) return false;

    try {
      const newPhoto = {
        id: Date.now() + Math.random(),
        data: currentPhoto,
        pageNumber: (capturedPhotos?.length || 0) + 1,
        timestamp: new Date().toISOString(),
        studentRoll: studentData.rollNumber,
      };

      if (onPhotosUpdate) {
        onPhotosUpdate((prev) => [...(prev || []), newPhoto]);
      }

      setCurrentPhoto(null);
      return true;
    } catch (error) {
      console.error("Error adding photo:", error);
      return false;
    }
  }, [currentPhoto, capturedPhotos, onPhotosUpdate, studentData.rollNumber]);

  // Keep and add more photos
  const handleKeepAndAddMore = useCallback(() => {
    if (currentPhoto && !isProcessing) {
      addCurrentPhotoToCaptured();
      setTimeout(() => {
        if (captureBtnRef.current) {
          captureBtnRef.current.focus();
        }
      }, 100);
    }
  }, [currentPhoto, isProcessing, addCurrentPhotoToCaptured]);

  // Retake photo
  const handleRetake = useCallback(() => {
    setCurrentPhoto(null);
  }, []);

  // Finish and upload photos
  const handleFinish = useCallback(async () => {
    const totalPhotos = (capturedPhotos?.length || 0) + (currentPhoto ? 1 : 0);

    if (totalPhotos === 0) {
      alert("Please capture at least one photo before finishing.");
      return;
    }

    try {
      setUploading(true);

      let finalPhotos = [...(capturedPhotos || [])];

      // Add current photo if exists
      if (currentPhoto) {
        const newPhoto = {
          id: Date.now(),
          data: currentPhoto,
          pageNumber: (capturedPhotos?.length || 0) + 1,
          timestamp: new Date().toISOString(),
          studentRoll: studentData.rollNumber,
        };
        finalPhotos.push(newPhoto);
      }

      const success = await onFinish(finalPhotos);

      if (success) {
        setCurrentPhoto(null);
        if (onPhotosUpdate) {
          onPhotosUpdate([]);
        }

        // Auto move to next student
        if (hasNextStudent) {
          setTimeout(() => {
            onNextStudent();
          }, 500);
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error("Error finishing photo session:", error);
    } finally {
      setUploading(false);
    }
  }, [
    currentPhoto,
    capturedPhotos,
    onFinish,
    studentData.rollNumber,
    hasNextStudent,
    onPhotosUpdate,
    onNextStudent,
    onClose,
  ]);

  // Handle next student
  const handleNextStudent = useCallback(() => {
    setCurrentPhoto(null);
    if (onPhotosUpdate) {
      onPhotosUpdate([]);
    }
    onNextStudent();
  }, [onNextStudent, onPhotosUpdate]);

  // Remove photo from captured list
  const handleRemovePhoto = useCallback(
    (photoId) => {
      if (onPhotosUpdate) {
        onPhotosUpdate((prev) => prev.filter((photo) => photo.id !== photoId));
      }
    },
    [onPhotosUpdate]
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
            if (!currentPhoto && !isProcessing && cameraReady) {
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
            handleFinish();
          }
          break;
        case "a":
        case "A":
          if (currentPhoto) handleKeepAndAddMore();
          break;
        case "n":
        case "N":
          if (hasNextStudent && !uploading) {
            handleNextStudent();
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
      capturedPhotos,
      uploading,
      hasNextStudent,
      handleTakePhoto,
      handleKeepAndAddMore,
      handleRetake,
      handleFinish,
      handleNextStudent,
      onClose,
    ]
  );

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
  }, [currentPhoto, cameraReady]);

  // Camera initialization
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        await setupCamera();
      } catch (error) {
        if (mounted) {
          console.error("Failed to initialize camera:", error);
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
    };
  }, [setupCamera]);

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
              disabled={isProcessing || !cameraReady || uploading}
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
                  disabled={isProcessing || uploading}
                >
                  ➕ Keep & Next (Enter/A)
                </button>
                <button
                  ref={finishBtnRef}
                  type="button"
                  className="action-btn finish"
                  onClick={handleFinish}
                  disabled={uploading}
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

              {cameraReady && (
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
                        <span className="mini-page-no">{photo.pageNumber}</span>
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
                {isProcessing ? (
                  <div className="processing-overlay">
                    <div className="spinner"></div>
                    <p>Capturing Photo...</p>
                  </div>
                ) : (
                  <button
                    ref={captureBtnRef}
                    type="button"
                    className="capture-btn-large"
                    onClick={handleTakePhoto}
                    disabled={isProcessing || !cameraReady || uploading}
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
                    onClick={handleFinish}
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
                    onClick={handleNextStudent}
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
});

PhotoCapture.displayName = 'PhotoCapture';

export default PhotoCapture;
