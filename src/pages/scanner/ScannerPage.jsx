import React, { useState, useMemo, Suspense } from "react";
import StudentTable from "../../components/StudentTable";
import Stats from "../../components/Stats";
import ClassSelector from "../../components/ClassSelector";
import ErrorBanner from "../../components/ErrorBanner";
import ExcelUploader from "../../components/ExcelUploader";
import { useStudents } from "../../hooks/useStudents";
import { useClasses } from "../../hooks/useClasses";
import { useAppHandlers } from "../../hooks/useAppHandlers";
import { useUploadExcel } from "../../hooks/useUploadExcel";
import { useTenant } from "../../context/TenantContext";

// Code splitting: Lazy load PhotoCapture (large component)
const PhotoCapture = React.lazy(() => import("../../components/PhotoCapture"));

const ScannerPage = () => {
  const { tenantId } = useTenant();

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
  const students = useStudents(classes.currentClass, classes.currentSubject, currentPage, itemsPerPage);

  const { isUploading, handleFileUpload } = useUploadExcel({
    classes,
    students,
    setIsExcelUploaded,
    itemsPerPage
  });

  // Handlers Hook
  const {
    handleClassChange,
    handleCreateNewClass,
    handleFindClass,
    handlePhotosCaptured,
    handleNextStudent,
    handleStatusChange,
    handleGeneratePDF,
    handleDeletePDF,
    handleRemarkChange,
    handleMarkAsAbsent,
    handleMarkAsMissing,
    handlePageChange,
    handleItemsPerPageChange,
    handleScanRequest,
    getNextStudent
  } = useAppHandlers({
    classes,
    students,
    state: {
      currentPage,
      itemsPerPage,
      selectedStudent,
      showPhotoCapture,
      capturedPhotos,
      isExcelUploaded
    },
    setState: {
      setCurrentPage,
      setItemsPerPage,
      setSelectedStudent,
      setShowPhotoCapture,
      setCapturedPhotos,
      setIsExcelUploaded
    }
  });

  const hasNextStudent = useMemo(() => !!getNextStudent(), [getNextStudent]);

  // Memoized stats for Stats component
  const statsData = useMemo(
    () => ({
      total: students.totalStudents,
      scanned: students.stats.scanned,
      absent: students.stats.absent,
      missing: students.stats.missing,
    }),
    [students.totalStudents, students.stats]
  );

  return (
    <div className="scanner-page">
      <div className="page-header-minimal">
        <h1>{tenantId?.toUpperCase()} Exam Scanner</h1>
        <p>Current Class: <strong>{classes.getClassDisplayName()}</strong></p>
      </div>

      <ErrorBanner
        error={students.error}
        onDismiss={() => students.setError(null)}
      />

      <div className="setup-workflow">
        <div className="workflow-step">
          <h2>Step 1: Select or Create Class</h2>
          <ClassSelector
            currentClass={classes.currentClass}
            availableClasses={classes.availableClasses}
            newClassName={classes.newClassName}
            onClassChange={handleClassChange}
            onNewClassNameChange={classes.setNewClassName}
            onCreateNewClass={handleCreateNewClass}
            onFindClass={handleFindClass}
          />
        </div>

        <div className="workflow-step">
          <h2>Step 2: Subject & Excel Upload</h2>
          <ExcelUploader
            currentClass={classes.currentClass}
            currentSubject={classes.currentSubject}
            availableSubjects={classes.availableSubjects}
            onSubjectChange={classes.setCurrentSubject}
            onExcelUpload={handleFileUpload}
            isUploading={isUploading}
            onAddSubject={classes.addSubject}
          />
        </div>
      </div>

      <Stats {...statsData} currentClass={classes.currentClass} />

      <StudentTable
        students={students.students}
        onStatusChange={handleStatusChange}
        onRemarkChange={handleRemarkChange}
        selectedStudent={selectedStudent}
        onSelectStudent={handleScanRequest}
        onGeneratePDF={handleGeneratePDF}
        onDeletePDF={handleDeletePDF}
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
        <Suspense
          fallback={
            <div className="photo-capture-overlay">
              <div className="photo-capture-modal">
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <div className="spinner"></div>
                  <p>Loading camera...</p>
                </div>
              </div>
            </div>
          }
        >
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
    </div>
  );
};

export default ScannerPage;
