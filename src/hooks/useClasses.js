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

  // Load classes on mount
  useEffect(() => {
    fetchAvailableClasses();
  }, [fetchAvailableClasses]);

  // Create new class
  const createNewClass = useCallback(() => {
    if (!newClassName.trim()) {
      return { success: false, error: "Please enter a class name" };
    }

    try {
      const normalizedClassName = newClassName.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      setCurrentClass(normalizedClassName);
      setNewClassName('');
      
      return { success: true, className: normalizedClassName };
    } catch (error) {
      return { success: false, error: "Failed to create new class" };
    }
  }, [newClassName]);

  // Handle class change
  const changeClass = useCallback((newClass) => {
    setCurrentClass(newClass);
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
  };
};

