import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing copy number state and validation
 * Ensures copy number is required before photo capture
 * @returns {Object} Copy number state and handlers
 */
export const useCopyNumber = () => {
    const [copyNumber, setCopyNumber] = useState('');

    /**
     * Validates copy number input
     * @param {string} value - Copy number value to validate
     * @returns {boolean} True if valid
     */
    const isValidCopyNumber = useCallback((value) => {
        return value && value.trim().length > 0;
    }, []);

    /**
     * Updates copy number state
     * @param {string} value - New copy number value
     */
    const updateCopyNumber = useCallback((value) => {
        setCopyNumber(value);
    }, []);

    /**
     * Resets copy number to empty string
     */
    const resetCopyNumber = useCallback(() => {
        setCopyNumber('');
    }, []);

    /**
     * Memoized validation state
     */
    const isValid = useMemo(() => {
        return isValidCopyNumber(copyNumber);
    }, [copyNumber, isValidCopyNumber]);

    /**
     * Memoized trimmed copy number for use in filenames
     */
    const trimmedCopyNumber = useMemo(() => {
        return copyNumber.trim();
    }, [copyNumber]);

    return {
        copyNumber,
        isValid,
        trimmedCopyNumber,
        updateCopyNumber,
        resetCopyNumber,
        isValidCopyNumber
    };
};
