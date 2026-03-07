import { useEffect, useCallback } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 * @param {Object} handlers - Object containing handler functions for different actions
 * @param {Object} state - Current state object (isProcessing, cameraReady, etc.)
 */
export const useKeyboardShortcuts = (handlers, state) => {
    const {
        onCapture,
        onRetake,
        onFinish,
        onKeepAndAdd,
        onNextStudent,
        onClose
    } = handlers;

    const {
        currentPhoto,
        isProcessing,
        cameraReady,
        capturedPhotos,
        uploading,
        hasNextStudent,
        isCopyNumberValid
    } = state;

    const handleKeyPress = useCallback((e) => {
        // Ignore if input/textarea is focused
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            return;
        }

        const activeElement = document.activeElement;
        const isFocusOnButton = activeElement?.tagName === 'BUTTON';

        // Prevent default for specific keys to avoid scrolling/browser actions
        if (['r', 'R', 'k', 'K', 'f', 'F', 'a', 'A', 'n', 'N', 'Escape'].includes(e.key)) {
            e.preventDefault();
        }

        // If focus is on a button and Enter is pressed, let the button handle it
        if (isFocusOnButton && e.key === 'Enter') {
            return;
        }

        switch (e.key) {
            case 'Enter':
                if (!currentPhoto && !isProcessing && cameraReady && isCopyNumberValid) {
                    onCapture();
                } else if (currentPhoto) {
                    onKeepAndAdd();
                }
                break;
            case 'r':
            case 'R':
                if (currentPhoto) onRetake();
                break;
            case 'k':
            case 'K':
            case 'f':
            case 'F':
                if ((capturedPhotos?.length || 0) > 0 || currentPhoto) {
                    onFinish();
                }
                break;
            case 'a':
            case 'A':
                if (currentPhoto) onKeepAndAdd();
                break;
            case 'n':
            case 'N':
                if (hasNextStudent && !uploading) {
                    onNextStudent();
                }
                break;
            case 'Escape':
                if (onClose) onClose();
                break;
            default:
                break;
        }
    }, [
        currentPhoto,
        isProcessing,
        cameraReady,
        capturedPhotos,
        uploading,
        hasNextStudent,
        isCopyNumberValid,
        onCapture,
        onRetake,
        onFinish,
        onKeepAndAdd,
        onNextStudent,
        onClose
    ]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);
};
