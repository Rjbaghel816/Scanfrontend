import React, { useState, useEffect } from "react";
import StudentTable from "./components/StudentTable";
import Stats from "./components/Stats";
import PhotoCapture from "./components/PhotoCapture";
import ClassSelector from "./components/ClassSelector";
import apiService from "./services/api";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isExcelUploaded, setIsExcelUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Class Management State
  const [currentClass, setCurrentClass] = useState('default');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load available classes
  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  // Fetch students when class or pagination changes
  useEffect(() => {
    if (currentClass && currentClass !== 'default') {
      fetchStudents();
    }
  }, [currentPage, itemsPerPage, currentClass]);

  const fetchAvailableClasses = async () => {
    try {
      const response = await apiService.getClasses();
      if (response.success) {
        setAvailableClasses(response.classes);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchStudents = async (page = currentPage, limit = itemsPerPage) => {
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
        setCurrentPage(response.pagination.currentPage);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new class
  const handleCreateNewClass = async () => {
    if (!newClassName.trim()) {
      setError("Please enter a class name");
      return;
    }

    try {
      const normalizedClassName = newClassName.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      setCurrentClass(normalizedClassName);
      setNewClassName('');
      setStudents([]);
      setTotalStudents(0);
      setCurrentPage(1);
      setIsExcelUploaded(false);
      
      console.log(`✅ Created new class: ${normalizedClassName}`);
      setError(null);
    } catch (error) {
      setError("Failed to create new class");
    }
  };

  // Handle class change
  const handleClassChange = async (newClass) => {
    setCurrentClass(newClass);
    setStudents([]);
    setTotalStudents(0);
    setCurrentPage(1);
    setIsExcelUploaded(false);
    
    if (showPhotoCapture) {
      setShowPhotoCapture(false);
      setSelectedStudent(null);
      setCapturedPhotos([]);
    }
    
    console.log(`✅ Switched to class: ${newClass}`);
  };

  // ✅ FIXED: Excel upload with class
  const uploadExcelToBackend = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // ✅ FIX: Only append className once
      formData.append('className', currentClass);

      console.log('📤 Sending Excel upload request for class:', currentClass);
      
      const response = await apiService.uploadExcelWithClass(formData, currentClass);
      
      if (response.success) {
        setIsExcelUploaded(true);
        await fetchStudents(1, itemsPerPage);
        await fetchAvailableClasses();
        
        setError(null);
      }
    } catch (error) {
      console.error('Excel upload failed:', error);
      setError(error.message || "Failed to upload Excel file");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError("Please upload a valid Excel file (.xlsx, .xls)");
      return;
    }

    if (!currentClass || currentClass === 'default') {
      setError("Please select or create a class first");
      return;
    }

    uploadExcelToBackend(file);
    event.target.value = "";
  };

  // ✅ FIXED: Photo upload with class
  const handlePhotosCaptured = async (photosArray) => {
    if (!selectedStudent || photosArray.length === 0) {
      console.error("No student selected or no photos to upload");
      return false;
    }

    try {
      console.log(`📤 Uploading ${photosArray.length} images for ${selectedStudent.rollNumber} in class ${currentClass}...`);

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

      // ✅ FIX: Only append className once
      formData.append('className', currentClass);

      const response = await apiService.uploadScans(selectedStudent._id, formData, currentClass);
      
      if (response.success) {
        console.log(`✅ Successfully uploaded ${photosArray.length} pages for ${selectedStudent.rollNumber}`);
        await fetchStudents(currentPage, itemsPerPage);
        return true;
      } else {
        setError(response.message || "Failed to upload scans");
        return false;
      }
    } catch (error) {
      console.error("Upload scans error:", error);
      setError("Failed to upload scanned images");
      return false;
    }
  };

  // Status change with class
  const handleStatusChange = async (studentId, newStatus) => {
    try {
      const response = await apiService.updateStudentStatus(studentId, newStatus, '', currentClass);
      if (response.success) {
        setStudents(prev => prev.map(student => 
          student._id === studentId 
            ? { ...student, status: newStatus }
            : student
        ));

        if (selectedStudent && selectedStudent._id === studentId && 
            (newStatus === 'Absent' || newStatus === 'Missing')) {
          setTimeout(() => {
            handleNextStudent();
          }, 300);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      setError("Failed to update student status");
    }
  };

  // PDF generation with class
  const handleGeneratePDF = async (student) => {
    try {
      const result = await apiService.generatePDF(student._id, currentClass);
      if (result.success) {
        console.log(`✅ PDF downloaded: ${result.filename}`);
        await fetchStudents(currentPage, itemsPerPage);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      setError("PDF download failed. Please try again.");
    }
  };

  // Remark change with class
  const handleRemarkChange = async (studentId, remark) => {
    try {
      const response = await apiService.updateStudentRemark(studentId, remark, currentClass);
      if (response.success) {
        setStudents(prev => prev.map(student => 
          student._id === studentId 
            ? { ...student, remark }
            : student
        ));
      }
    } catch (error) {
      console.error("Failed to update remark:", error);
    }
  };

  const getNextStudent = () => {
    if (!selectedStudent || students.length === 0) return null;
    
    const currentIndex = students.findIndex(s => s._id === selectedStudent._id);
    if (currentIndex === -1) return null;
    
    for (let i = currentIndex + 1; i < students.length; i++) {
      if (students[i].status === 'Pending' && !students[i].isScanned) {
        return students[i];
      }
    }
    
    return null;
  };

  const handleNextStudent = () => {
    const nextStudent = getNextStudent();
    if (nextStudent) {
      setSelectedStudent(nextStudent);
      setCapturedPhotos([]);
    } else {
      setShowPhotoCapture(false);
      setSelectedStudent(null);
      setCapturedPhotos([]);
    }
  };

  const handleMarkAsAbsent = async () => {
    if (!selectedStudent) return;
    try {
      const response = await apiService.updateStudentStatus(selectedStudent._id, 'Absent', '', currentClass);
      if (response.success) {
        await fetchStudents(currentPage, itemsPerPage);
        handleNextStudent();
      }
    } catch (error) {
      console.error("Failed to mark as absent:", error);
      setError("Failed to mark student as absent");
    }
  };

  const handleMarkAsMissing = async () => {
    if (!selectedStudent) return;
    try {
      const response = await apiService.updateStudentStatus(selectedStudent._id, 'Missing', '', currentClass);
      if (response.success) {
        await fetchStudents(currentPage, itemsPerPage);
        handleNextStudent();
      }
    } catch (error) {
      console.error("Failed to mark as missing:", error);
      setError("Failed to mark student as missing");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleScanRequest = (student) => {
    setSelectedStudent(student);
    setShowPhotoCapture(true);
    setCapturedPhotos([]);
  };

  const hasNextStudent = !!getNextStudent();

  const getClassDisplayName = () => {
    if (currentClass === 'default') return 'No Class Selected';
    return currentClass.replace(/_/g, ' ');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📱 University Exam Copy Scanner</h1>
          <p>Multi-Class Scanning System | Current Class: <strong>{getClassDisplayName()}</strong></p>
        </div>

        <div className="class-selector-section">
          <ClassSelector
            currentClass={currentClass}
            availableClasses={availableClasses}
            newClassName={newClassName}
            onClassChange={handleClassChange}
            onNewClassNameChange={setNewClassName}
            onCreateNewClass={handleCreateNewClass}
          />
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="error-close">
              ×
            </button>
          </div>
        )}

        <Stats
          total={totalStudents}
          scanned={students.filter(s => s.isScanned).length}
          absent={students.filter(s => s.status === 'Absent').length}
          missing={students.filter(s => s.status === 'Missing').length}
          currentClass={currentClass}
        />

        <StudentTable
          students={students}
          onStatusChange={handleStatusChange}
          onRemarkChange={handleRemarkChange}
          selectedStudent={selectedStudent}
          onSelectStudent={handleScanRequest}
          onGeneratePDF={handleGeneratePDF}
          onExcelUpload={handleFileUpload}
          isExcelUploaded={isExcelUploaded}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalStudents={totalStudents}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          currentClass={currentClass}
        />

        {showPhotoCapture && selectedStudent && (
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
            currentClass={currentClass}
          />
        )}
      </main>
    </div>
  );
}

export default App;