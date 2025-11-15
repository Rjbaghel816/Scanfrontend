import React, { useState, useCallback, useMemo, Suspense } from "react";
import StudentTable from "./components/StudentTable";
import Stats from "./components/Stats";
import ClassSelector from "./components/ClassSelector";
import ErrorBanner from "./components/ErrorBanner";
import { useStudents } from "./hooks/useStudents";
import { useClasses } from "./hooks/useClasses";
import apiService from "./services/api";
import "./App.css";

// Code splitting: Lazy load PhotoCapture (large component)
const PhotoCapture = React.lazy(() => import("./components/PhotoCapture"));

/**
 * App Component
 * Main application component with optimized state management and code splitting
 */
function App() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Photo capture state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isExcelUploaded, setIsExcelUploaded] = useState(false);

  // Custom hooks
  const classes = useClasses();
  const students = useStudents(classes.currentClass, currentPage, itemsPerPage);

  // Memoized handlers
  const handleClassChange = useCallback(async (newClass) => {
    classes.changeClass(newClass);
    setCurrentPage(1);
    setIsExcelUploaded(false);
    
    if (showPhotoCapture) {
      setShowPhotoCapture(false);
      setSelectedStudent(null);
      setCapturedPhotos([]);
    }
    
    console.log(`✅ Switched to class: ${newClass}`);
  }, [classes, showPhotoCapture]);

  const handleCreateNewClass = useCallback(() => {
    const result = classes.createNewClass();
    if (result.success) {
      setCurrentPage(1);
      setIsExcelUploaded(false);
      students.setError(null);
      console.log(`✅ Created new class: ${result.className}`);
    } else {
      students.setError(result.error);
    }
  }, [classes, students]);

  // Excel upload handler
  const uploadExcelToBackend = useCallback(async (file) => {
    if (!classes.currentClass || classes.currentClass === 'default') {
      students.setError("Please select or create a class first");
      return;
    }

    students.setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('className', classes.currentClass);

      console.log('📤 Sending Excel upload request for class:', classes.currentClass);
      
      const response = await apiService.uploadExcelWithClass(formData, classes.currentClass);
      
      if (response.success) {
        setIsExcelUploaded(true);
        await students.fetchStudents(1, itemsPerPage);
        await classes.fetchAvailableClasses();
        students.setError(null);
      }
    } catch (error) {
      console.error('Excel upload failed:', error);
      students.setError(error.message || "Failed to upload Excel file");
    }
  }, [classes, students, itemsPerPage]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      students.setError("Please upload a valid Excel file (.xlsx, .xls)");
      return;
    }

    if (!classes.currentClass || classes.currentClass === 'default') {
      students.setError("Please select or create a class first");
      return;
    }

    uploadExcelToBackend(file);
    event.target.value = "";
  }, [classes, students, uploadExcelToBackend]);

  // Photo upload handler
  const handlePhotosCaptured = useCallback(async (photosArray) => {
    if (!selectedStudent || photosArray.length === 0) {
      console.error("No student selected or no photos to upload");
      return false;
    }

    try {
      console.log(`📤 Uploading ${photosArray.length} images for ${selectedStudent.rollNumber} in class ${classes.currentClass}...`);

      const imageFiles = await Promise.all(
        photosArray.map(async (photo, index) => {
          const response = await fetch(photo.data);
          const blob = await response.blob();
          return new File([blob], `page_${index + 1}.jpg`, { type: 'image/jpeg' });
        })
      );

      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('className', classes.currentClass);

      const response = await apiService.uploadScans(selectedStudent._id, formData, classes.currentClass);
      
      if (response.success) {
        console.log(`✅ Successfully uploaded ${photosArray.length} pages for ${selectedStudent.rollNumber}`);
        await students.fetchStudents(currentPage, itemsPerPage);
        return true;
      } else {
        students.setError(response.message || "Failed to upload scans");
        return false;
      }
    } catch (error) {
      console.error("Upload scans error:", error);
      students.setError("Failed to upload scanned images");
      return false;
    }
  }, [selectedStudent, classes, students, currentPage, itemsPerPage]);

  // Next student handler (moved before handleStatusChange to fix dependency issue)
  const getNextStudent = useCallback(() => {
    return students.getNextPendingStudent(selectedStudent);
  }, [students, selectedStudent]);

  const handleNextStudent = useCallback(() => {
    const nextStudent = getNextStudent();
    if (nextStudent) {
      setSelectedStudent(nextStudent);
      setCapturedPhotos([]);
    } else {
      setShowPhotoCapture(false);
      setSelectedStudent(null);
      setCapturedPhotos([]);
    }
  }, [getNextStudent]);

  // Status change handler
  const handleStatusChange = useCallback(async (studentId, newStatus) => {
    try {
      const response = await apiService.updateStudentStatus(studentId, newStatus, '', classes.currentClass);
      if (response.success) {
        students.updateStudent(studentId, { status: newStatus });

        if (selectedStudent && selectedStudent._id === studentId && 
            (newStatus === 'Absent' || newStatus === 'Missing')) {
          setTimeout(() => {
            handleNextStudent();
          }, 300);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      students.setError("Failed to update student status");
    }
  }, [classes, students, selectedStudent, handleNextStudent]);

  // PDF generation handler
  const handleGeneratePDF = useCallback(async (student) => {
    try {
      const result = await apiService.generatePDF(student._id, classes.currentClass);
      if (result.success) {
        console.log(`✅ PDF downloaded: ${result.filename}`);
        await students.fetchStudents(currentPage, itemsPerPage);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      students.setError("PDF download failed. Please try again.");
    }
  }, [classes, students, currentPage, itemsPerPage]);

  // Remark change handler
  const handleRemarkChange = useCallback(async (studentId, remark) => {
    try {
      const response = await apiService.updateStudentRemark(studentId, remark, classes.currentClass);
      if (response.success) {
        students.updateStudent(studentId, { remark });
      }
    } catch (error) {
      console.error("Failed to update remark:", error);
    }
  }, [classes, students]);

  const hasNextStudent = useMemo(() => !!getNextStudent(), [getNextStudent]);

  // Mark as absent handler
  const handleMarkAsAbsent = useCallback(async () => {
    if (!selectedStudent) return;
    try {
      const response = await apiService.updateStudentStatus(selectedStudent._id, 'Absent', '', classes.currentClass);
      if (response.success) {
        await students.fetchStudents(currentPage, itemsPerPage);
        handleNextStudent();
      }
    } catch (error) {
      console.error("Failed to mark as absent:", error);
      students.setError("Failed to mark student as absent");
    }
  }, [selectedStudent, classes, students, currentPage, itemsPerPage, handleNextStudent]);

  // Mark as missing handler
  const handleMarkAsMissing = useCallback(async () => {
    if (!selectedStudent) return;
    try {
      const response = await apiService.updateStudentStatus(selectedStudent._id, 'Missing', '', classes.currentClass);
      if (response.success) {
        await students.fetchStudents(currentPage, itemsPerPage);
        handleNextStudent();
      }
    } catch (error) {
      console.error("Failed to mark as missing:", error);
      students.setError("Failed to mark student as missing");
    }
  }, [selectedStudent, classes, students, currentPage, itemsPerPage, handleNextStudent]);

  // Pagination handlers
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= students.totalPages) {
      setCurrentPage(newPage);
    }
  }, [students.totalPages]);

  const handleItemsPerPageChange = useCallback((e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Scan request handler
  const handleScanRequest = useCallback((student) => {
    setSelectedStudent(student);
    setShowPhotoCapture(true);
    setCapturedPhotos([]);
  }, []);

  // Memoized stats for Stats component
  const statsData = useMemo(() => ({
    total: students.totalStudents,
    scanned: students.stats.scanned,
    absent: students.stats.absent,
    missing: students.stats.missing,
  }), [students.totalStudents, students.stats]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📱 University Exam Copy Scanner</h1>
          <p>Multi-Class Scanning System | Current Class: <strong>{classes.getClassDisplayName()}</strong></p>
        </div>

        <div className="class-selector-section">
          <ClassSelector
            currentClass={classes.currentClass}
            availableClasses={classes.availableClasses}
            newClassName={classes.newClassName}
            onClassChange={handleClassChange}
            onNewClassNameChange={classes.setNewClassName}
            onCreateNewClass={handleCreateNewClass}
          />
        </div>
      </header>

      <main className="main-content">
        <ErrorBanner 
          error={students.error} 
          onDismiss={() => students.setError(null)} 
        />

        <Stats {...statsData} currentClass={classes.currentClass} />

        <StudentTable
          students={students.students}
          onStatusChange={handleStatusChange}
          onRemarkChange={handleRemarkChange}
          selectedStudent={selectedStudent}
          onSelectStudent={handleScanRequest}
          onGeneratePDF={handleGeneratePDF}
          onExcelUpload={handleFileUpload}
          isExcelUploaded={isExcelUploaded}
          loading={students.loading}
          currentPage={currentPage}
          totalPages={students.totalPages}
          totalStudents={students.totalStudents}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          currentClass={classes.currentClass}
        />

        {showPhotoCapture && selectedStudent && (
          <Suspense fallback={
            <div className="photo-capture-overlay">
              <div className="photo-capture-modal">
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <div className="spinner"></div>
                  <p>Loading camera...</p>
                </div>
              </div>
            </div>
          }>
            <PhotoCapture
              student={selectedStudent}
              capturedPhotos={capturedPhotos}
              onPhotosUpdate={setCapturedPhotos}
              onFinish={handlePhotosCaptured}
              onClose={() => {
                setShowPhotoCapture(false);
                setSelectedStudent(null);
                setCapturedPhotos([]);
              }}
              onNextStudent={handleNextStudent}
              onMarkAsAbsent={handleMarkAsAbsent}
              onMarkAsMissing={handleMarkAsMissing}
              hasNextStudent={hasNextStudent}
              currentClass={classes.currentClass}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default App;
