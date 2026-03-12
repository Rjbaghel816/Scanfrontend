import React, { memo } from "react";

/**
 * StudentTableRow Component
 * Individual row component for student table
 * Memoized to prevent unnecessary re-renders
 */
const StudentTableRow = memo(
  ({
    student,
    selectedStudent,
    onStatusChange,
    onRemarkChange,
    onSelectStudent,
    onGeneratePDF,
    onDeletePDF,
    currentClass,
  }) => {
    const handleScanClick = () => {
      if (
        !student.isScanned &&
        student.status !== "Absent" &&
        student.status !== "Missing"
      ) {
        onSelectStudent(student);
      }
    };

    const handlePDFClick = (event) => {
      event.stopPropagation();
      if (student.isScanned && student.pdfPath) {
        onGeneratePDF(student);
      } else if (student.isScanned && !student.pdfPath) {
        alert("PDF is being generated. Please wait a moment...");
      } else {
        alert("Please scan copies first to generate PDF.");
      }
    };

    const handleDeletePDFClick = (event) => {
      event.stopPropagation();
      if (onDeletePDF && student.pdfPath) {
        onDeletePDF(student);
      }
    };

    const getScanTime = (scanTime) => {
      if (!scanTime) return "";
      return new Date(scanTime).toLocaleTimeString();
    };

    const isSelected = selectedStudent?._id === student._id;
    const isScanned = student.isScanned;
    const isAbsent = student.status === "Absent";
    const isMissing = student.status === "Missing";
    const canScan = !isScanned && !isAbsent && !isMissing;

    return (
      <tr
        className={`student-row ${
          isScanned ? "scanned" : ""
        } ${isSelected ? "selected" : ""} ${
          isAbsent ? "absent" : isMissing ? "missing" : ""
        }`}
      >
        <td className="roll-number">{student.rollNumber}</td>
        <td className="subject-code">{student.subjectCode}</td>
        <td className="subject-name">{student.subjectName}</td>

        <td>
          <div className="scan-status">
            <span
              className={`status-indicator ${isScanned ? "scanned" : "pending"}`}
            >
              {isScanned ? "✓ Scanned" : "⏳ Pending"}
            </span>
          </div>
        </td>

        <td className="pages-count">
          <div className="pages-info">
            <span className="pages-number">
              {student.scannedPages ? student.scannedPages.length : 0}
            </span>
            {student.scannedPages && student.scannedPages.length > 0 && (
              <span className="pages-label">pages</span>
            )}
          </div>
        </td>

        <td className="scan-time">{getScanTime(student.scanTime)}</td>

        <td className="pdf-status">
          <div className="pdf-info">
            {student.pdfPath ? (
              <span className="pdf-available" title="PDF Available">
                📄 Ready
              </span>
            ) : isScanned ? (
              <span className="pdf-processing" title="PDF Being Generated">
                ⏳ Processsing
              </span>
            ) : (
              <span className="pdf-pending" title="Not Scanned Yet">
                ❌ Not Generated
              </span>
            )}
          </div>
        </td>

        <td>
          <select
            value={student.status}
            onChange={(e) =>
              onStatusChange(student._id || student.id, e.target.value)
            }
            className={`status-select ${
              isAbsent
                ? "absent"
                : isMissing
                  ? "missing"
                  : student.status === "Present"
                    ? "present"
                    : "pending"
            }`}
            disabled={isScanned}
          >
            <option value="Pending">Pending</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Missing">Missing</option>
          </select>
        </td>

        <td>
          <div className="action-buttons">
            <div className="action-buttons-left">
              <button
                className={`scan-btn ${isScanned ? "scanned" : ""} ${
                  !canScan ? "disabled" : ""
                }`}
                onClick={handleScanClick}
                disabled={!canScan}
                title={
                  isScanned
                    ? "Already scanned"
                    : !canScan
                      ? "Cannot scan absent/missing students"
                      : "Scan student copies"
                }
              >
                {isScanned ? (
                  <>
                    <span className="btn-icon">✓</span>
                    Scanned
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📷</span>
                    Scan Copy
                  </>
                )}
              </button>

              {student.pdfPath ? (
                <button
                  className="pdf-btn available"
                  onClick={handlePDFClick}
                  title="Download PDF"
                >
                  <span className="btn-icon">📄</span>
                  Download PDF
                </button>
              ) : isScanned ? (
                <button
                  className="pdf-btn processing"
                  disabled
                  title="PDF is being generated"
                >
                  <span className="btn-icon">⏳</span>
                  Generating...
                </button>
              ) : null}
            </div>
            {student.pdfPath && (
              <button
                className="delete-pdf-icon"
                onClick={handleDeletePDFClick}
                title="Delete PDF / Cancel Scan"
                aria-label="Delete PDF"
              >
                ❌
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for accurate memoization
    return (
      prevProps.student._id === nextProps.student._id &&
      prevProps.student.status === nextProps.student.status &&
      prevProps.student.remark === nextProps.student.remark &&
      prevProps.student.isScanned === nextProps.student.isScanned &&
      prevProps.student.pdfPath === nextProps.student.pdfPath &&
      prevProps.student.scannedPages?.length ===
        nextProps.student.scannedPages?.length &&
      prevProps.selectedStudent?._id === nextProps.selectedStudent?._id &&
      prevProps.onStatusChange === nextProps.onStatusChange &&
      prevProps.onRemarkChange === nextProps.onRemarkChange &&
      prevProps.onDeletePDF === nextProps.onDeletePDF &&
      prevProps.onGeneratePDF === nextProps.onGeneratePDF &&
      prevProps.onSelectStudent === nextProps.onSelectStudent
    );
  },
);

StudentTableRow.displayName = "StudentTableRow";

export default StudentTableRow;
