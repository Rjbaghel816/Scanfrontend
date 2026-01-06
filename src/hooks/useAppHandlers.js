import { useCallback } from 'react';
import apiService from '../services/api';
import { compressImage } from '../utils/imageCompression';

/**
 * Custom hook to manage all event handlers for the main App component
 * Separates business logic from UI rendering
 */
export const useAppHandlers = ({
    classes,
    students,
    state,
    setState
}) => {
    const {
        currentPage,
        itemsPerPage,
        selectedStudent,
        showPhotoCapture,
        capturedPhotos
    } = state;

    const {
        setCurrentPage,
        setItemsPerPage,
        setSelectedStudent,
        setShowPhotoCapture,
        setCapturedPhotos,
        setIsExcelUploaded
    } = setState;

    // Class handlers
    const handleClassChange = useCallback(
        async (newClass) => {
            classes.changeClass(newClass);
            setCurrentPage(1);
            setIsExcelUploaded(false);

            if (showPhotoCapture) {
                setShowPhotoCapture(false);
                setSelectedStudent(null);
                setCapturedPhotos([]);
            }

            console.log(`✅ Switched to class: ${newClass}`);
        },
        [classes, showPhotoCapture, setCurrentPage, setIsExcelUploaded, setShowPhotoCapture, setSelectedStudent, setCapturedPhotos]
    );

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
    }, [classes, students, setCurrentPage, setIsExcelUploaded]);

    // Excel upload handler
    const uploadExcelToBackend = useCallback(
        async (file) => {
            if (!classes.currentClass || classes.currentClass === "default") {
                students.setError("Please select or create a class first");
                return;
            }

            students.setError(null);
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("className", classes.currentClass);

                console.log(
                    "📤 Sending Excel upload request for class:",
                    classes.currentClass
                );

                const response = await apiService.uploadExcelWithClass(
                    formData,
                    classes.currentClass
                );

                if (response.success) {
                    setIsExcelUploaded(true);
                    await students.fetchStudents(1, itemsPerPage);
                    await classes.fetchAvailableClasses();
                    students.setError(null);
                }
            } catch (error) {
                console.error("Excel upload failed:", error);
                students.setError(error.message || "Failed to upload Excel file");
            }
        },
        [classes, students, itemsPerPage, setIsExcelUploaded]
    );

    const handleFileUpload = useCallback(
        (event) => {
            const file = event.target.files[0];
            if (!file) return;

            if (!file.name.match(/\.(xlsx|xls)$/)) {
                students.setError("Please upload a valid Excel file (.xlsx, .xls)");
                return;
            }

            if (!classes.currentClass || classes.currentClass === "default") {
                students.setError("Please select or create a class first");
                return;
            }

            uploadExcelToBackend(file);
            event.target.value = "";
        },
        [classes, students, uploadExcelToBackend]
    );

    // Photo upload handler
    const handlePhotosCaptured = useCallback(
        async (photosArray) => {
            if (!selectedStudent || photosArray.length === 0) {
                console.error("No student selected or no photos to upload");
                return false;
            }

            try {
                console.log(
                    `📤 Uploading ${photosArray.length} images for ${selectedStudent.rollNumber} in class ${classes.currentClass}...`
                );

                // Parallel compression and file preparation
                const imageFiles = await Promise.all(
                    photosArray.map(async (photo, index) => {
                        try {
                            // Compress image before upload
                            const compressedFile = await compressImage(photo.data, {
                                maxWidth: 1600,
                                maxHeight: 2200,
                                quality: 0.8,
                            });
                            // Rename with index for order
                            return new File([compressedFile], `page_${index + 1}.jpg`, {
                                type: "image/jpeg",
                            });
                        } catch (err) {
                            console.warn(
                                `Compression failed for page ${index + 1}, using original`,
                                err
                            );
                            const response = await fetch(photo.data);
                            const blob = await response.blob();
                            return new File([blob], `page_${index + 1}.jpg`, {
                                type: "image/jpeg",
                            });
                        }
                    })
                );

                const formData = new FormData();
                imageFiles.forEach((file) => {
                    formData.append("images", file);
                });
                formData.append("className", classes.currentClass);

                const response = await apiService.uploadScans(
                    selectedStudent._id,
                    formData,
                    classes.currentClass
                );

                if (response.success) {
                    console.log(
                        `✅ Upload started for ${selectedStudent.rollNumber}. Job ID: ${response.jobId}`
                    );

                    // ✅ Optimistic Update: Immediately update UI without waiting for DB
                    students.updateStudent(selectedStudent._id, {
                        status: 'Present',
                        isScanned: true,
                        scannedPages: photosArray.map((_, i) => ({ pageNumber: i + 1 })), // Mock pages
                    });

                    // Show non-blocking success message
                    const successMsg = `🚀 Uploading ${photosArray.length} pages in background...`;
                    students.setError(successMsg);
                    setTimeout(() => students.setError(null), 2000);

                    // Trigger background fetch to eventually get the real state (optional)
                    students.fetchStudents(currentPage, itemsPerPage).catch(console.error);

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
        },
        [selectedStudent, classes, students, currentPage, itemsPerPage]
    );

    // Next student handler
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
    }, [getNextStudent, setSelectedStudent, setCapturedPhotos, setShowPhotoCapture]);

    // Status change handler
    const handleStatusChange = useCallback(
        async (studentId, newStatus) => {
            try {
                const response = await apiService.updateStudentStatus(
                    studentId,
                    newStatus,
                    "",
                    classes.currentClass
                );
                if (response.success) {
                    students.updateStudent(studentId, { status: newStatus });

                    if (
                        selectedStudent &&
                        selectedStudent._id === studentId &&
                        (newStatus === "Absent" || newStatus === "Missing")
                    ) {
                        setTimeout(() => {
                            handleNextStudent();
                        }, 300);
                    }
                }
            } catch (error) {
                console.error("Failed to update status:", error);
                students.setError("Failed to update student status");
            }
        },
        [classes, students, selectedStudent, handleNextStudent]
    );

    // PDF generation handler
    const handleGeneratePDF = useCallback(
        async (student) => {
            try {
                const result = await apiService.generatePDF(
                    student._id,
                    classes.currentClass
                );
                if (result.success) {
                    console.log(`✅ PDF downloaded: ${result.filename}`);
                    await students.fetchStudents(currentPage, itemsPerPage);
                }
            } catch (error) {
                console.error("PDF generation failed:", error);
                students.setError("PDF download failed. Please try again.");
            }
        },
        [classes, students, currentPage, itemsPerPage]
    );

    // Delete PDF handler
    const handleDeletePDF = useCallback(
        async (student) => {
            if (!student.pdfPath) {
                students.setError("No PDF found to delete");
                return;
            }

            if (
                !window.confirm(
                    `Are you sure you want to delete the PDF for ${student.rollNumber}? This will allow you to scan again.`
                )
            ) {
                return;
            }

            try {
                const response = await apiService.deletePDF(
                    student._id,
                    classes.currentClass
                );
                if (response.success) {
                    // Immediately update local state to reflect changes
                    students.updateStudent(student._id, {
                        status: "Pending",
                        isScanned: false,
                        scannedPages: [],
                        scanTime: null,
                        pdfPath: null,
                        pdfName: null,
                        pdfGeneratedAt: null,
                    });

                    // Refresh student list to get updated data from backend
                    await students.fetchStudents(currentPage, itemsPerPage);

                    // Show success message
                    const successMessage = `✅ PDF deleted for ${student.rollNumber}. You can scan again.`;
                    students.setError(successMessage);
                    // Clear success message after 3 seconds
                    setTimeout(() => {
                        students.setError(null);
                    }, 3000);
                } else {
                    students.setError(response.message || "Failed to delete PDF");
                }
            } catch (error) {
                console.error("Delete PDF failed:", error);
                students.setError("Failed to delete PDF. Please try again.");
            }
        },
        [classes, students, currentPage, itemsPerPage]
    );

    // Remark change handler
    const handleRemarkChange = useCallback(
        async (studentId, remark) => {
            try {
                const response = await apiService.updateStudentRemark(
                    studentId,
                    remark,
                    classes.currentClass
                );
                if (response.success) {
                    students.updateStudent(studentId, { remark });
                }
            } catch (error) {
                console.error("Failed to update remark:", error);
            }
        },
        [classes, students]
    );

    // Mark as absent handler
    const handleMarkAsAbsent = useCallback(async () => {
        if (!selectedStudent) return;
        try {
            const response = await apiService.updateStudentStatus(
                selectedStudent._id,
                "Absent",
                "",
                classes.currentClass
            );
            if (response.success) {
                await students.fetchStudents(currentPage, itemsPerPage);
                handleNextStudent();
            }
        } catch (error) {
            console.error("Failed to mark as absent:", error);
            students.setError("Failed to mark student as absent");
        }
    }, [
        selectedStudent,
        classes,
        students,
        currentPage,
        itemsPerPage,
        handleNextStudent,
    ]);

    // Mark as missing handler
    const handleMarkAsMissing = useCallback(async () => {
        if (!selectedStudent) return;
        try {
            const response = await apiService.updateStudentStatus(
                selectedStudent._id,
                "Missing",
                "",
                classes.currentClass
            );
            if (response.success) {
                await students.fetchStudents(currentPage, itemsPerPage);
                handleNextStudent();
            }
        } catch (error) {
            console.error("Failed to mark as missing:", error);
            students.setError("Failed to mark student as missing");
        }
    }, [
        selectedStudent,
        classes,
        students,
        currentPage,
        itemsPerPage,
        handleNextStudent,
    ]);

    // Pagination handlers
    const handlePageChange = useCallback(
        (newPage) => {
            if (newPage >= 1 && newPage <= students.totalPages) {
                setCurrentPage(newPage);
            }
        },
        [students.totalPages, setCurrentPage]
    );

    const handleItemsPerPageChange = useCallback((e) => {
        const newItemsPerPage = parseInt(e.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    }, [setItemsPerPage, setCurrentPage]);

    // Scan request handler
    const handleScanRequest = useCallback((student) => {
        setSelectedStudent(student);
        setShowPhotoCapture(true);
        setCapturedPhotos([]);
    }, [setSelectedStudent, setShowPhotoCapture, setCapturedPhotos]);

    return {
        handleClassChange,
        handleCreateNewClass,
        handleFileUpload,
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
    };
};
