/**
 * Custom hook for managing student data, fetching, and pagination
 * Handles all student-related state and API operations
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import apiService from '../services/api';

export const useStudents = (currentClass, currentPage, itemsPerPage) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchStudents = useCallback(async (page = currentPage, limit = itemsPerPage) => {
    if (!currentClass || currentClass === 'default') return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getStudents({
        page,
        limit,
        className: currentClass,
        sortBy: 'rollNumber',
        sortOrder: 'asc'
      });
      
      if (response.success) {
        setStudents(response.students);
        setTotalStudents(response.pagination.totalStudents);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentClass, currentPage, itemsPerPage]);

  // Fetch students when dependencies change
  useEffect(() => {
    if (currentClass && currentClass !== 'default') {
      fetchStudents(currentPage, itemsPerPage);
    } else {
      setStudents([]);
      setTotalStudents(0);
      setTotalPages(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, currentClass]);

  // Memoized stats calculations
  const stats = useMemo(() => ({
    scanned: students.filter(s => s.isScanned).length,
    absent: students.filter(s => s.status === 'Absent').length,
    missing: students.filter(s => s.status === 'Missing').length,
    pdfs: students.filter(s => s.pdfPath).length,
  }), [students]);

  // Update student in list
  const updateStudent = useCallback((studentId, updates) => {
    setStudents(prev => prev.map(student => 
      student._id === studentId 
        ? { ...student, ...updates }
        : student
    ));
  }, []);

  // Get next pending student
  const getNextPendingStudent = useCallback((selectedStudent) => {
    if (!selectedStudent || students.length === 0) return null;
    
    const currentIndex = students.findIndex(s => s._id === selectedStudent._id);
    if (currentIndex === -1) return null;
    
    for (let i = currentIndex + 1; i < students.length; i++) {
      if (students[i].status === 'Pending' && !students[i].isScanned) {
        return students[i];
      }
    }
    
    return null;
  }, [students]);

  return {
    students,
    loading,
    error,
    totalStudents,
    totalPages,
    stats,
    fetchStudents,
    updateStudent,
    getNextPendingStudent,
    setError,
  };
};

