import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing photo capture state and logic
 * @param {Object} props - Props from the main component
 * @param {Object} camera - Camera hook return value
 */
export const usePhotoCapture = (props, camera) => {
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

    // Local state
    const [currentPhoto, setCurrentPhoto] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Refs
    const captureBtnRef = useRef(null);
    const keepAndAddRef = useRef(null);

    // Actions
    const handleTakePhoto = useCallback(async () => {
        if (isProcessing || !cameraReady) return;

        try {
            setIsProcessing(true);
            // Yield to render to ensure video is hidden (UI update)
            await new Promise(resolve => setTimeout(resolve, 50));

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

    const addCurrentPhotoToCaptured = useCallback(() => {
        if (!currentPhoto) return false;

        try {
            const newPhoto = {
                id: Date.now() + Math.random(),
                data: currentPhoto,
                pageNumber: (capturedPhotos?.length || 0) + 1,
                timestamp: new Date().toISOString(),
                studentRoll: student?.rollNumber || 'Unknown',
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
    }, [currentPhoto, capturedPhotos, onPhotosUpdate, student]);

    const handleKeepAndAddMore = useCallback(() => {
        if (currentPhoto && !isProcessing) {
            addCurrentPhotoToCaptured();
            // Focus management is handled by useEffect in the component or we can return a ref trigger
            setTimeout(() => {
                if (captureBtnRef.current) {
                    captureBtnRef.current.focus();
                }
            }, 100);
        }
    }, [currentPhoto, isProcessing, addCurrentPhotoToCaptured]);

    const handleRetake = useCallback(() => {
        setCurrentPhoto(null);
    }, []);

    const handleFinishSession = useCallback(async () => {
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
                    studentRoll: student?.rollNumber || 'Unknown',
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
        student,
        hasNextStudent,
        onPhotosUpdate,
        onNextStudent,
        onClose,
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
        onNextStudent();
    }, [onNextStudent, onPhotosUpdate]);

    return {
        state: {
            currentPhoto,
            isProcessing,
            uploading,
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
