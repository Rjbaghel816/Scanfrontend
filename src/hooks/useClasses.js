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
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return;

    try {
      const response = await apiService.getClasses();
      if (response && response.success) {
        setAvailableClasses(response.classes);
      }
    } catch (error) {
      console.error("Failed to fetch classes gracefully:", error);
      setAvailableClasses([]); // Fallback to empty array
    }
  }, []);

  // ✅ NEW: Fetch subjects for current class
  const fetchSubjects = useCallback(async (className) => {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId || !className || className === 'default') {
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

  // ✅ NEW: Search and select a class directly
  const searchClass = useCallback(async (className) => {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return { success: false, error: "Multi-tenant context missing" };
    if (!className || !className.trim()) return { success: false, error: "Enter class code" };
    
    const searchCode = className.trim().toLowerCase();
    
    // Check if class exists in already fetched classes
    const existingClass = availableClasses.find(c => c.className === searchCode);
    
    if (existingClass) {
      setCurrentClass(searchCode);
      return { success: true };
    }

    // If not found in memory, try to refresh class list
    try {
      const response = await apiService.getClasses();
      if (response.success) {
        setAvailableClasses(response.classes);
        const refetchedClass = response.classes.find(c => c.className === searchCode);
        if (refetchedClass) {
          setCurrentClass(searchCode);
          return { success: true };
        }
      }
      return { success: false, error: "Class not found" };
    } catch (error) {
      console.error("Search class failed:", error);
      return { success: false, error: "Search failed" };
    }
  }, [availableClasses]);

  // ✅ FIXED: Create new class — NO PREFIX
  const createNewClass = useCallback(async () => {
    if (!newClassName.trim()) {
      return { success: false, error: "Please enter a class name" };
    }

    // Normalize to basic alphanumeric for collection safety, but keep as user entered
    const normalizedClassName = newClassName.trim().toLowerCase();

    try {
      // ✅ Call the backend to persist the class collection
      const response = await apiService.createClass(normalizedClassName);

      if (!response.success) {
        return { success: false, error: response.message || "Failed to create class" };
      }

      const newClassEntry = response.class || {
        collectionName: normalizedClassName,
        className: normalizedClassName,
        displayName: normalizedClassName.toUpperCase()
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

  const addSubject = useCallback(async (subjectCode) => {
    if (!subjectCode || !subjectCode.trim() || currentClass === 'default') return { success: false, error: "Invalid class or subject" };
    
    const normalized = subjectCode.trim().toUpperCase();
    
    try {
      const response = await apiService.createSubject(currentClass, normalized);
      
      if (response.success) {
        // Optimistic update
        setAvailableSubjects(prev => {
          if (prev.includes(normalized)) return prev;
          return [...prev, normalized].sort();
        });
        setCurrentSubject(normalized);
        
        // Refresh from server to be sure
        await fetchSubjects(currentClass);
        return { success: true };
      } else {
        return { success: false, error: response.message || "Failed to add subject" };
      }
    } catch (error) {
      console.error("Add subject failed:", error);
      return { success: false, error: "Failed to save subject to database" };
    }
  }, [currentClass, setAvailableSubjects, setCurrentSubject, fetchSubjects]);

  // Handle class change
  const changeClass = useCallback((newClass) => {
    setCurrentClass(newClass);
    // Subject will be reset by useEffect if needed
  }, []);

  // Get display name for current class
  const getClassDisplayName = useCallback(() => {
    if (currentClass === 'default') return 'No Class Selected';
    return currentClass.toUpperCase();
  }, [currentClass]);

  return {
    currentClass,
    setCurrentClass, // ✅ Exported directly for consumers that call it by name
    availableClasses,
    newClassName,
    setNewClassName,
    createNewClass,
    changeClass,    // Alias for setCurrentClass with side-effect handling
    getClassDisplayName,
    fetchAvailableClasses,
    currentSubject,
    setCurrentSubject,
    availableSubjects,
    addSubject,
    isLoadingSubjects,
    fetchSubjects,
    searchClass
  };
};
