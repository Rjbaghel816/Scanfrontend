import React, { useRef, useMemo, memo } from "react";
import StudentTableRow from "./StudentTableRow";
import PaginationControls from "./PaginationControls";
import "./StudentTable.css";

/**
 * StudentTable Component
 * Displays student data in a table format with pagination
 * Optimized with memoization and extracted sub-components
 */
const StudentTable = memo(({
  students,
  onStatusChange,
  onRemarkChange,
  selectedStudent,
  onSelectStudent,
  onGeneratePDF,
  onDeletePDF,
  isExcelUploaded,
  loading,
  currentPage,
  totalPages,
  totalStudents,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  currentClass,
}) => {

  // Memoized quick stats
  const quickStats = useMemo(() => {
    if (students.length === 0) return null;

    return {
      scanned: students.filter((s) => s.isScanned).length,
      pdfs: students.filter((s) => s.pdfPath).length,
      absent: students.filter((s) => s.status === 'Absent').length,
      missing: students.filter((s) => s.status === 'Missing').length,
    };
  }, [students]);

  // Memoized class display name
  const classDisplayName = useMemo(() => {
    if (!currentClass || currentClass === 'default') return 'Not Selected';
    return currentClass.replace(/_/g, ' ');
  }, [currentClass]);

  if (loading) {
    return (
      <div className="student-table-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading students data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-table-container">
      {/* Excel Upload Section */}
      <div className="excel-upload-section">
        <div className="class-info-badge">
          🎯 Current Class: <strong>{classDisplayName}</strong>
        </div>

        {quickStats && (
          <div className="quick-stats">
            <span className="stat-item">📋 Total: {totalStudents}</span>
            <span className="stat-item">
              ✅ Scanned: {quickStats.scanned}
            </span>
            <span className="stat-item">
              📄 PDFs: {quickStats.pdfs}
            </span>
            <span className="stat-item">
              ❌ Absent: {quickStats.absent}
            </span>
            <span className="stat-item">
              📝 Missing: {quickStats.missing}
            </span>
          </div>
        )}
      </div>

      {/* Pagination Controls - Top */}
      {students.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalStudents={totalStudents}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          position="top"
        />
      )}

      <div className="table-wrapper">
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>
              {!currentClass || currentClass === 'default'
                ? "Please Select or Create a Class"
                : "No Students Data"}
            </h3>
            <p>
              {!currentClass || currentClass === 'default'
                ? "Choose a class from the dropdown above to get started"
                : "Please upload an Excel file to get started"}
            </p>
          </div>
        ) : (
          <table className="students-table">
            <thead className="table-header">
              <tr>
                <th>Roll No</th>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Scan Status</th>
                <th>Pages</th>
                <th>Scan Time</th>
                <th>PDF Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <StudentTableRow
                  key={student._id || student.id}
                  student={student}
                  selectedStudent={selectedStudent}
                  onStatusChange={onStatusChange}
                  onRemarkChange={onRemarkChange}
                  onSelectStudent={onSelectStudent}
                  onGeneratePDF={onGeneratePDF}
                  onDeletePDF={onDeletePDF}
                  currentClass={currentClass}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls - Bottom */}
      {students.length > 0 && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalStudents={totalStudents}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          position="bottom"
        />
      )}

      {students.length > 0 && (
        <div className="table-footer">
          <div className="footer-info">
            <span className="footer-item">
              🎯 Current Class: <strong>{classDisplayName}</strong>
            </span>
            <span className="footer-item">
              💡 Tip: Scan copies first, then download PDF
            </span>
            <span className="footer-item">
              📁 PDFs are automatically generated after scanning
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

StudentTable.displayName = 'StudentTable';

export default StudentTable;
