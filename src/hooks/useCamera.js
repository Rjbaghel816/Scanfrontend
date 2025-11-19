/**
 * Custom hook for camera management
 * Handles camera initialization, stream management, and photo capture
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const streamRef = useRef(null);

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
    if (!streamRef.current) return null;

    try {
      if ("ImageCapture" in window) {
        const track = streamRef.current.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const blob = await imageCapture.takePhoto();
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        return await captureWithCanvas();
      }
    } catch (error) {
      console.error("ImageCapture failed, trying canvas fallback:", error);
      return await captureWithCanvas();
    }
  }, []);

  // Canvas fallback for photo capture
  const captureWithCanvas = useCallback(async () => {
    if (!streamRef.current) return null;

    try {
      const tempVideo = document.createElement("video");
      tempVideo.srcObject = streamRef.current;
      tempVideo.muted = true;

      await new Promise((resolve, reject) => {
        tempVideo.onloadedmetadata = () => {
          tempVideo.play().then(resolve).catch(reject);
        };
        setTimeout(() => reject(new Error("Video load timeout")), 5000);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = document.createElement("canvas");
      canvas.width = tempVideo.videoWidth || 1280;
      canvas.height = tempVideo.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

      const imageDataURL = canvas.toDataURL("image/jpeg", 0.9);
      tempVideo.srcObject = null;
      return imageDataURL;
    } catch (error) {
      console.error("Canvas fallback failed:", error);
      throw error;
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
  };
};

