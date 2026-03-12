/**
 * Custom hook for managing student data, fetching, and pagination
 * Handles all student-related state and API operations
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiService from '../services/api';

export const useStudents = (currentClass, currentSubject, currentPage, itemsPerPage) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const abortControllerRef = useRef(null);

  // Memoize fetch function
  const fetchStudents = useCallback(async (page = currentPage, limit = itemsPerPage) => {
    if (!currentClass || currentClass === 'default' || !currentSubject) return;

    // Cancel any in-flight request (prevents race conditions)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getStudents({
        page,
        limit,
        className: currentClass,
        subject: currentSubject,
        sortBy: 'rollNumber',
        sortOrder: 'asc'
      });

      if (response.success) {
        setStudents(response.students);
        setTotalStudents(response.pagination.totalStudents);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Ignore cancelled requests
      console.error('Failed to fetch students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [currentClass, currentSubject, currentPage, itemsPerPage]);

  // Fetch students when dependencies change
  useEffect(() => {
    if (currentClass && currentClass !== 'default' && currentSubject) {
      fetchStudents(currentPage, itemsPerPage);
    } else {
      // Reset when class/subject is cleared
      setStudents([]);
      setTotalStudents(0);
      setTotalPages(1);
      setError(null);
    }

    // Cleanup: abort any in-flight request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, itemsPerPage, currentClass, currentSubject, fetchStudents]);

  // Memoized stats — computed from current page data
  const stats = useMemo(() => ({
    scanned: students.filter(s => s.isScanned).length,
    absent: students.filter(s => s.status === 'Absent').length,
    missing: students.filter(s => s.status === 'Missing').length,
    pdfs: students.filter(s => s.pdfPath).length,
  }), [students]);

  // Optimistic update: update student locally without re-fetching
  const updateStudent = useCallback((studentId, updates) => {
    setStudents(prev => prev.map(student =>
      student._id === studentId
        ? { ...student, ...updates }
        : student
    ));
  }, []);

  // Get next pending student for auto-advance
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
