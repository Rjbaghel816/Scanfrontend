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

  // Update ref and localStorage when state changes
  const setCropMargins = useCallback((newMargins) => {
    setCropMarginsState(newMargins);
    cropMarginsRef.current = newMargins;
    localStorage.setItem('scanCropMargins', JSON.stringify(newMargins));
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
    console.log("Starting capturePhoto...");
    if (!streamRef.current) {
      console.error("Stream not ready");
      return null;
    }

    let rawBitmap = null;
    let rawBlob = null;

    try {
      if ("ImageCapture" in window) {
        try {
          const track = streamRef.current.getVideoTracks()[0];
          if (!track) throw new Error("No video track found");

          const imageCapture = new ImageCapture(track);
          rawBlob = await imageCapture.takePhoto();
          console.log("ImageCapture success, blob size:", rawBlob.size);

          rawBitmap = await createImageBitmap(rawBlob);
          console.log("Bitmap created:", rawBitmap.width, "x", rawBitmap.height);
        } catch (err) {
          console.warn("ImageCapture failed, falling back to canvas:", err);
          return await captureWithCanvas();
        }
      } else {
        return await captureWithCanvas();
      }

      // If we are here, we have rawBitmap from ImageCapture
      // Apply cropping
      try {
        const { width, height } = rawBitmap;
        const { top, bottom, left, right } = cropMarginsRef.current;

        console.log("Applying crop:", { top, bottom, left, right }, "to", width, "x", height);

        // Safe clamping
        const safeLeft = Math.max(0, Math.min(left, width - 1));
        const safeRight = Math.max(0, Math.min(right, width - safeLeft - 1));
        const safeTop = Math.max(0, Math.min(top, height - 1));
        const safeBottom = Math.max(0, Math.min(bottom, height - safeTop - 1));

        const finalWidth = width - safeLeft - safeRight;
        const finalHeight = height - safeTop - safeBottom;

        if (finalWidth <= 0 || finalHeight <= 0) {
          console.warn("Invalid crop dimensions, returning full image");
          throw new Error("Invalid crop dimensions");
        }

        const canvas = document.createElement("canvas");
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(rawBitmap, safeLeft, safeTop, finalWidth, finalHeight, 0, 0, finalWidth, finalHeight);

        const result = canvas.toDataURL("image/jpeg", 0.9);
        console.log("Capture success (cropped)");
        return result;

      } catch (cropError) {
        console.error("Cropping failed, returning original:", cropError);
        // Fallback to original
        const canvas = document.createElement("canvas");
        canvas.width = rawBitmap.width;
        canvas.height = rawBitmap.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(rawBitmap, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.9);
      }

    } catch (error) {
      console.error("Fatal capture error:", error);
      return await captureWithCanvas();
    }
  }, []);

  // Canvas fallback for photo capture
  const captureWithCanvas = useCallback(async () => {
    console.log("Starting captureWithCanvas...");
    if (!streamRef.current) {
      console.error("No stream for canvas capture");
      return null;
    }

    try {
      const tempVideo = document.createElement("video");
      tempVideo.srcObject = streamRef.current;
      tempVideo.muted = true;
      tempVideo.playsInline = true;

      await new Promise((resolve, reject) => {
        tempVideo.onloadedmetadata = () => {
          tempVideo.play().then(resolve).catch(reject);
        };
        setTimeout(() => reject(new Error("Video load timeout")), 3000);
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const sourceWidth = tempVideo.videoWidth;
      const sourceHeight = tempVideo.videoHeight;

      if (!sourceWidth || !sourceHeight) {
        throw new Error("Invalid video dimensions");
      }

      console.log("Video ready:", sourceWidth, "x", sourceHeight);

      // Apply cropping
      const { top, bottom, left, right } = cropMarginsRef.current;

      const safeLeft = Math.max(0, Math.min(left, sourceWidth - 1));
      const safeRight = Math.max(0, Math.min(right, sourceWidth - safeLeft - 1));
      const safeTop = Math.max(0, Math.min(top, sourceHeight - 1));
      const safeBottom = Math.max(0, Math.min(bottom, sourceHeight - safeTop - 1));

      const finalWidth = sourceWidth - safeLeft - safeRight;
      const finalHeight = sourceHeight - safeTop - safeBottom;

      console.log("Canvas crop:", { safeLeft, safeTop, finalWidth, finalHeight });

      if (finalWidth <= 0 || finalHeight <= 0) {
        // Fallback
        console.warn("Invalid crop, using full frame");
        const canvas = document.createElement("canvas");
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(tempVideo, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.9);
      }

      const canvas = document.createElement("canvas");
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(tempVideo, safeLeft, safeTop, finalWidth, finalHeight, 0, 0, finalWidth, finalHeight);

      const imageDataURL = canvas.toDataURL("image/jpeg", 0.9);

      tempVideo.srcObject = null;
      tempVideo.remove();

      return imageDataURL;

    } catch (error) {
      console.error("Canvas capture failed:", error);
      return null;
    }
  }, []);

  // Retry camera
  const retryCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    await setupCamera();
  }, [setupCamera]);

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
    resetCropSettings
  };
};
