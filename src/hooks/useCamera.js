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
    console.log("capture-start");

    if (!streamRef.current) {
      console.error("Stream not ready");
      return "";
    }

    let rawBitmap = null;

    try {
      // 1. Try ImageCapture
      if ("ImageCapture" in window) {
        try {
          const track = streamRef.current.getVideoTracks()[0];
          if (track && track.readyState === 'live') {
            const imageCapture = new ImageCapture(track);
            try {
              const blob = await imageCapture.takePhoto();
              rawBitmap = await createImageBitmap(blob);
            } catch (e) {
              console.warn("takePhoto failed, trying grabFrame", e);
              rawBitmap = await imageCapture.grabFrame();
            }
          }
        } catch (err) {
          console.warn("ImageCapture failed", err);
        }
      }

      // 2. Fallback to Video Element
      if (!rawBitmap) {
        const video = document.createElement('video');
        video.srcObject = streamRef.current;
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => video.play().then(resolve).catch(reject);
          setTimeout(() => reject(new Error("Video timeout")), 2000);
        });

        await new Promise(r => setTimeout(r, 100));
        rawBitmap = await createImageBitmap(video);

        video.srcObject = null;
        video.remove();
      }

      if (!rawBitmap) throw new Error("Failed to acquire image");

      const videoWidth = rawBitmap.width;
      const videoHeight = rawBitmap.height;

      const cropMargins = cropMarginsRef.current;
      console.log("crop applied:", cropMargins);

      // STRICT FORMULA AS REQUESTED
      const cropLeft = cropMargins.left;
      const cropTop = cropMargins.top;

      // Calculate width/height based on margins
      // Clamp safely if margins exceed bounds
      let cropWidth = videoWidth - cropMargins.left - cropMargins.right;
      let cropHeight = videoHeight - cropMargins.top - cropMargins.bottom;

      // Safety check: if crop region is invalid, fallback to full image
      if (cropWidth <= 0 || cropHeight <= 0) {
        console.warn("Invalid crop dimensions, returning full image");
        const canvas = document.createElement('canvas');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        canvas.getContext('2d').drawImage(rawBitmap, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.9);
      }

      // Ensure we don't read outside source bounds
      const sourceX = Math.max(0, cropLeft);
      const sourceY = Math.max(0, cropTop);
      const sourceWidth = Math.min(cropWidth, videoWidth - sourceX);
      const sourceHeight = Math.min(cropHeight, videoHeight - sourceY);

      console.log("final canvas size:", sourceWidth, sourceHeight);

      // Execute Crop
      const canvas = document.createElement('canvas');
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        rawBitmap,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, sourceWidth, sourceHeight
      );

      return canvas.toDataURL('image/jpeg', 0.9);

    } catch (error) {
      console.error("Capture failed:", error);
      return "";
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
