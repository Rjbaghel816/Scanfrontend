/**
 * Custom hook for camera management
 * Handles camera initialization, stream management, and photo capture
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// MANUAL CROP CONFIGURATION
// Initial values if nothing in localStorage
const DEFAULT_CROP = { top: 0, bottom: 0, left: 0, right: 0 };

export const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Crop state management
  const [cropMargins, setCropMarginsState] = useState(() => {
    try {
      const saved = localStorage.getItem('scanCropMargins');
      return saved ? JSON.parse(saved) : DEFAULT_CROP;
    } catch (e) {
      return DEFAULT_CROP;
    }
  });

  // Show UI if no margins are set (all 0)
  const [showCropUI, setShowCropUI] = useState(() => {
    const { top, bottom, left, right } = cropMargins;
    return top === 0 && bottom === 0 && left === 0 && right === 0;
  });

  const streamRef = useRef(null);
  const cropMarginsRef = useRef(cropMargins);
  const videoElementRef = useRef(null);

  // Update ref and localStorage when state changes
  const setCropMargins = useCallback((newMargins) => {
    const normalized = {
      top: Math.round(newMargins?.top || 0),
      bottom: Math.round(newMargins?.bottom || 0),
      left: Math.round(newMargins?.left || 0),
      right: Math.round(newMargins?.right || 0),
    };
    setCropMarginsState(normalized);
    cropMarginsRef.current = normalized;
    localStorage.setItem('scanCropMargins', JSON.stringify(normalized));
  }, []);

  const saveCropSettings = useCallback(() => {
    setShowCropUI(false);
  }, []);

  const resetCropSettings = useCallback(() => {
    setShowCropUI(true);
  }, []);

  // Sync ref on mount (in case of hot reload or other updates)
  useEffect(() => {
    cropMarginsRef.current = cropMargins;
  }, [cropMargins]);

  // Setup camera with fallback
  const setupCamera = useCallback(async () => {
    try {
      setCameraError(null);

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: "continuous",
          exposureMode: "continuous",
          whiteBalanceMode: "continuous"
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraReady(true);
      return true;
    } catch (error) {
      // Try front camera as fallback
      try {
        const fallbackConstraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            focusMode: "continuous",
            exposureMode: "continuous",
            whiteBalanceMode: "continuous"
          },
        };

        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
        setCameraReady(true);
        return true;
      } catch (fallbackError) {
        setCameraError("Camera access failed. Please check permissions.");
        setCameraReady(false);
        return false;
      }
    }
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Capture photo using ImageCapture API or canvas fallback
  const capturePhoto = useCallback(async () => {
    console.log("capture-start");

    // CRITICAL FIX: Use displayed video element for pixel-perfect capture
    const displayVideo = videoElementRef.current;
    if (!displayVideo) {
      console.error("Video element reference missing. Ensure setVideoElement is called.");
      return "";
    }
    if (!streamRef.current) {
      console.error("Stream reference missing.");
      return "";
    }

    // Ensure video metadata is loaded
    if (!displayVideo.videoWidth || !displayVideo.videoHeight) {
      console.error("Video metadata not loaded. Dimensions are 0.");
      return "";
    }

    let rawBitmap = null;
    const displayVideoWidth = displayVideo.videoWidth;
    const displayVideoHeight = displayVideo.videoHeight;

    try {
      // CRITICAL FIX: Use canvas.drawImage for pixel-perfect capture from displayed video
      // This guarantees we capture EXACTLY what the user sees on screen
      // No ImageCapture, no temp video - use the exact displayed video element
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = displayVideoWidth;
      captureCanvas.height = displayVideoHeight;
      const captureCtx = captureCanvas.getContext('2d');

      // Draw the exact frame visible to the user
      captureCtx.drawImage(displayVideo, 0, 0, displayVideoWidth, displayVideoHeight);

      // Convert to ImageBitmap for consistent processing
      rawBitmap = await createImageBitmap(captureCanvas);

      if (!rawBitmap) throw new Error("Failed to acquire image from displayed video");

      // Use displayed video dimensions (what user sees) as source of truth
      const videoWidth = displayVideoWidth;
      const videoHeight = displayVideoHeight;

      const cropMargins = cropMarginsRef.current;
      console.log("crop applied:", cropMargins);

      // STRICT FORMULA - NO ADDITIONAL OFFSETS
      const cropLeft = cropMargins.left;
      const cropTop = cropMargins.top;

      // Calculate width/height based on margins
      let cropWidth = videoWidth - cropMargins.left - cropMargins.right;
      let cropHeight = videoHeight - cropMargins.top - cropMargins.bottom;

      // CRITICAL FIX: Remove ALL clamping for TOP coordinate
      // Use cropTop DIRECTLY without any bounds checking
      const sourceX = Math.max(0, cropLeft);
      const sourceY = Math.max(0, cropTop);
      const sourceWidth = Math.max(1, Math.min(cropWidth, videoWidth - sourceX));
      const sourceHeight = Math.max(1, Math.min(cropHeight, videoHeight - sourceY));

      console.log("Crop coordinates:", {
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        videoWidth,
        videoHeight
      });

      // If crop region is invalid, fallback to full image
      if (sourceWidth <= 0 || sourceHeight <= 0) {
        console.warn("Invalid crop dimensions, returning full image");
        const canvas = document.createElement('canvas');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        canvas.getContext('2d').drawImage(rawBitmap, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.9);
      }

      // Execute Crop - NO OFFSETS, NO CLAMPING
      const canvas = document.createElement('canvas');
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        rawBitmap,
        sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
        0, 0, sourceWidth, sourceHeight               // Destination rectangle
      );

      return canvas.toDataURL('image/jpeg', 0.9);

    } catch (error) {
      console.error("Capture failed:", error);
      return "";
    }
  }, []);



  // Retry camera
  const retryCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    await setupCamera();
  }, [setupCamera]);

  // Set video element reference for pixel-perfect capture
  const setVideoElement = useCallback((videoElement) => {
    videoElementRef.current = videoElement;
  }, []);

  return {
    stream,
    cameraReady,
    cameraError,
    setupCamera,
    capturePhoto,
    retryCamera,
    cropMargins,
    setCropMargins,
    showCropUI,
    saveCropSettings,
    resetCropSettings,
    setVideoElement
  };
};
