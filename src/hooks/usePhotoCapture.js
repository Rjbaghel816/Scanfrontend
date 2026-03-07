import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing photo capture state and logic
 * @param {Object} props - Props from the main component
 * @param {Object} camera - Camera hook return value
 * @param {Object} copyNumberHook - Copy number hook return value
 */
export const usePhotoCapture = (props, camera, copyNumberHook) => {
    const {
        student,
        capturedPhotos = [],
        onPhotosUpdate,
        onFinish,
        onClose,
        onNextStudent,
        hasNextStudent
    } = props;

    const { cameraReady, capturePhoto } = camera;
    const { isValid: isCopyNumberValid, trimmedCopyNumber } = copyNumberHook || {
        isValid: false,
        trimmedCopyNumber: ''
    };

    // Local state
    const [currentPhoto, setCurrentPhoto] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Refs
    const captureBtnRef = useRef(null);
    const keepAndAddRef = useRef(null);



    // Actions
    const handleTakePhoto = useCallback(async () => {
        if (isProcessing) {
            console.warn("Capture already in progress");
            return;
        }
        if (!cameraReady) {
            console.warn("Camera not ready");
            return;
        }
        if (!isCopyNumberValid) {
            console.warn("Copy number invalid");
            return;
        }

        try {
            setIsProcessing(true);
            // Yield to render to ensure video is hidden (UI update)
            await new Promise(resolve => setTimeout(resolve, 50));

            const photoData = await capturePhoto();
            if (photoData) {
                setCurrentPhoto(photoData);
            } else {
                console.error("Capture returned empty data");
            }
        } catch (error) {
            console.error("Error capturing photo:", error);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, cameraReady, capturePhoto, isCopyNumberValid]);

    const addCurrentPhotoToCaptured = useCallback(() => {
        if (!currentPhoto || !isCopyNumberValid) return false;

        try {
            const newPhoto = {
                id: Date.now() + Math.random(),
                data: currentPhoto,
                pageNumber: (capturedPhotos?.length || 0) + 1,
                timestamp: new Date().toISOString(),
                studentRoll: student?.rollNumber || 'Unknown',
                copyNumber: trimmedCopyNumber, // Store copy number with photo
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
    }, [currentPhoto, capturedPhotos, onPhotosUpdate, student, isCopyNumberValid, trimmedCopyNumber]);

    const handleKeepAndAddMore = useCallback(() => {
        if (currentPhoto && !isProcessing && isCopyNumberValid) {
            addCurrentPhotoToCaptured();
            // Focus management
            setTimeout(() => {
                if (captureBtnRef.current) {
                    captureBtnRef.current.focus();
                }
            }, 100);
        }
    }, [currentPhoto, isProcessing, addCurrentPhotoToCaptured, isCopyNumberValid]);

    const handleRetake = useCallback(() => {
        setCurrentPhoto(null);
    }, []);

    const handleFinishSession = useCallback(async () => {
        const totalPhotos = (capturedPhotos?.length || 0) + (currentPhoto ? 1 : 0);

        if (totalPhotos === 0) {
            alert("Please capture at least one photo before finishing.");
            return false;
        }

        if (!isCopyNumberValid) {
            alert("Please enter a valid copy number before finishing.");
            return false;
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
                    studentRoll: student?.rollNumber || 'Unknown',
                    copyNumber: trimmedCopyNumber,
                };
                finalPhotos.push(newPhoto);
            }

            const success = await onFinish(finalPhotos);

            if (success) {
                setCurrentPhoto(null);
                if (onPhotosUpdate) {
                    onPhotosUpdate([]);
                }
                // Reset copy number
                if (copyNumberHook?.resetCopyNumber) {
                    copyNumberHook.resetCopyNumber();
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error("Error finishing photo session:", error);
            return false;
        } finally {
            setUploading(false);
        }
    }, [
        currentPhoto,
        capturedPhotos,
        onFinish,
        student,
        isCopyNumberValid,
        trimmedCopyNumber,
        onPhotosUpdate,
        copyNumberHook,
    ]);

    const handleRemovePhoto = useCallback((photoId) => {
        if (onPhotosUpdate) {
            onPhotosUpdate((prev) => prev.filter((photo) => photo.id !== photoId));
        }
    }, [onPhotosUpdate]);

    const handleNextStudentAction = useCallback(() => {
        setCurrentPhoto(null);
        if (onPhotosUpdate) {
            onPhotosUpdate([]);
        }
        // Reset copy number when moving to next student
        if (copyNumberHook?.resetCopyNumber) {
            copyNumberHook.resetCopyNumber();
        }
        onNextStudent();
    }, [onNextStudent, onPhotosUpdate, copyNumberHook]);

    return {
        state: {
            currentPhoto,
            isProcessing,
            uploading,
            isCopyNumberValid,
        },
        actions: {
            handleTakePhoto,
            handleKeepAndAddMore,
            handleRetake,
            handleFinishSession,
            handleRemovePhoto,
            handleNextStudentAction
        },
        refs: {
            captureBtnRef,
            keepAndAddRef
        }
    };
};