/**
 * Custom hook for managing class selection and creation
 * Handles class-related state and API operations
 */
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export const useClasses = () => {
  const [currentClass, setCurrentClass] = useState('default');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [currentSubject, setCurrentSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  // Fetch available classes
  const fetchAvailableClasses = useCallback(async () => {
    try {
      const response = await apiService.getClasses();
      if (response.success) {
        setAvailableClasses(response.classes);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  }, []);

  // ✅ NEW: Fetch subjects for current class
  const fetchSubjects = useCallback(async (className) => {
    if (!className || className === 'default') {
      setAvailableSubjects([]);
      return;
    }

    setIsLoadingSubjects(true);
    try {
      const response = await apiService.getSubjects(className);
      if (response.success) {
        setAvailableSubjects(response.subjects || []);
        
        // If current subject is not in the new list, reset it
        if (currentSubject && !response.subjects.includes(currentSubject)) {
          setCurrentSubject('');
        }
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      // Fallback to empty if error
      setAvailableSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [currentSubject]);

  // Load classes on mount
  useEffect(() => {
    fetchAvailableClasses();
  }, [fetchAvailableClasses]);

  // ✅ NEW: Fetch subjects whenever class changes
  useEffect(() => {
    fetchSubjects(currentClass);
  }, [currentClass, fetchSubjects]);

  // ✅ FIXED: Create new class — now calls the backend API and auto-selects the class
  const createNewClass = useCallback(async () => {
    if (!newClassName.trim()) {
      return { success: false, error: "Please enter a class name" };
    }

    const normalizedClassName = newClassName.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    try {
      // ✅ Call the backend to persist the class collection
      const response = await apiService.createClass(normalizedClassName);

      if (!response.success) {
        return { success: false, error: response.message || "Failed to create class" };
      }

      const newClassEntry = response.class || {
        collectionName: `class_${normalizedClassName}`,
        className: normalizedClassName,
        displayName: normalizedClassName.replace(/_/g, ' ')
      };

      // ✅ Add to dropdown list immediately (optimistic update)
      setAvailableClasses(prev => {
        const alreadyExists = prev.some(c => c.className === normalizedClassName);
        if (alreadyExists) return prev;
        return [...prev, newClassEntry];
      });

      // ✅ Auto-select the newly created class
      setCurrentClass(normalizedClassName);
      setCurrentSubject(''); // Reset subject for the new class
      setAvailableSubjects([]); // Clear subjects for the new class
      setNewClassName('');

      console.log(`✅ Class created & selected: ${normalizedClassName}`);
      return { success: true, className: normalizedClassName };
    } catch (error) {
      console.error("Failed to create class:", error);
      return { success: false, error: error.message || "Failed to create class" };
    }
  }, [newClassName, setCurrentClass, setCurrentSubject, setNewClassName]);

  const addSubject = useCallback((subjectCode) => {
    if (!subjectCode || !subjectCode.trim()) return;
    const normalized = subjectCode.trim().toUpperCase();
    setAvailableSubjects(prev => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized].sort();
    });
    setCurrentSubject(normalized);
  }, [setAvailableSubjects, setCurrentSubject]);

  // Handle class change
  const changeClass = useCallback((newClass) => {
    setCurrentClass(newClass);
    // Subject will be reset by useEffect if needed
  }, []);

  // Get display name for current class
  const getClassDisplayName = useCallback(() => {
    if (currentClass === 'default') return 'No Class Selected';
    return currentClass.replace(/_/g, ' ');
  }, [currentClass]);

  return {
    currentClass,
    availableClasses,
    newClassName,
    setNewClassName,
    createNewClass,
    changeClass,
    getClassDisplayName,
    fetchAvailableClasses,
    currentSubject,
    setCurrentSubject,
    availableSubjects,
    addSubject,
    isLoadingSubjects,
    fetchSubjects
  };
};
