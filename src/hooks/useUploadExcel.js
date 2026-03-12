import { useState, useCallback } from 'react';
import apiService from '../services/api';

export const useUploadExcel = ({ classes, students, setIsExcelUploaded, itemsPerPage }) => {
    const [isUploading, setIsUploading] = useState(false);

    const uploadExcelToBackend = useCallback(
        async (file) => {
            if (!classes.currentClass || classes.currentClass === "default") {
                students.setError("Please select or create a class first");
                return;
            }

            if (!classes.currentSubject) {
                students.setError("Please select a subject first");
                return;
            }

            students.setError(null);
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("className", classes.currentClass);
                formData.append("subject", classes.currentSubject);

                console.log(
                    "📤 Sending Excel upload request for class:",
                    classes.currentClass,
                    "subject:", 
                    classes.currentSubject
                );

                const response = await apiService.uploadExcelWithClass(
                    formData,
                    classes.currentClass
                );

                if (response.success) {
                    setIsExcelUploaded(true);
                    await students.fetchStudents(1, itemsPerPage);
                    await classes.fetchAvailableClasses();
                    if (classes.fetchSubjects) {
                        await classes.fetchSubjects(classes.currentClass);
                    }
                    students.setError(null);
                }
            } catch (error) {
                console.error("Excel upload failed:", error);
                students.setError(error.message || "Failed to upload Excel file");
            } finally {
                setIsUploading(false);
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

            uploadExcelToBackend(file);
            event.target.value = "";
        },
        [uploadExcelToBackend, students]
    );

    return {
        isUploading,
        handleFileUpload
    };
};
