const API_BASE = 'https://scanbackend-4l4e.onrender.com';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !isFormData) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }

        return data;
      } else {
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Download failed');
          } catch {
            throw new Error('Download failed');
          }
        }
        return response;
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ✅ NEW: Get all available classes
  async getClasses() {
    return this.request('/students/classes');
  }

  // ✅ UPDATED: Get students with class parameter
  async getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/students?${query}`);
  }

  async getStudent(studentId, className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/students/${studentId}?${query}`);
  }

  // ✅ UPDATED: Update student status with class
  async updateStudentStatus(studentId, status, remark = '', className = 'default') {
    return this.request(`/students/${studentId}/status`, {
      method: 'PATCH',
      body: { status, remark, className }
    });
  }

  // ✅ UPDATED: Update student remark with class
  async updateStudentRemark(studentId, remark, className = 'default') {
    return this.request(`/students/${studentId}/remark`, {
      method: 'PATCH',
      body: { remark, className }
    });
  }

  // ✅ FIXED: Excel Upload with proper class name handling
  async uploadExcelWithClass(formData, className = 'default') {
    try {
      console.log('📤 Uploading Excel file for class:', className);
      
      // ✅ FIX: Remove duplicate className and add only once
      if (formData.has('className')) {
        formData.delete('className');
      }
      
      if (className && className !== 'default') {
        formData.append('className', className);
      }
      
      const response = await fetch(`${API_BASE}/students/upload-excel`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Excel upload failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Excel upload API error:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Delete student with class
  async deleteStudent(studentId, className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/students/${studentId}?${query}`, {
      method: 'DELETE'
    });
  }

  async deleteAllStudents(className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/students?${query}`, {
      method: 'DELETE'
    });
  }

  // ✅ FIXED: Upload scans with class
  async uploadScans(studentId, formData, className = 'default') {
    // ✅ FIX: Remove duplicate className and add only once
    if (formData.has('className')) {
      formData.delete('className');
    }
    
    if (className && className !== 'default') {
      formData.append('className', className);
    }

    const response = await fetch(`${API_BASE}/upload/scan/${studentId}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    return response.json();
  }

  // ✅ UPDATED: Delete scans with class
  async deleteScans(studentId, className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/upload/scan/${studentId}?${query}`, {
      method: 'DELETE'
    });
  }

  // ✅ UPDATED: Generate PDF with class
  async generatePDF(studentId, className = 'default') {
    try {
      const query = new URLSearchParams({ className }).toString();
      const response = await fetch(`${API_BASE}/students/${studentId}/generate-pdf?${query}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'PDF generation failed');
      }

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Copy_${studentId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true,
        filename: filename
      };
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Download PDF with class
  async downloadPDF(studentId, className = 'default') {
    try {
      const query = new URLSearchParams({ className }).toString();
      const response = await fetch(`${API_BASE}/upload/pdf/${studentId}?${query}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'PDF download failed');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Copy_${studentId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true,
        filename: filename
      };
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Get stats with class
  async getStats(className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/students/stats/summary?${query}`);
  }

  // ✅ NEW: Get PDF info with class
  async getPDFInfo(studentId, className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/upload/pdf/${studentId}/info?${query}`);
  }

  // ✅ NEW: Rescan student with class
  async rescanStudent(studentId, className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/upload/rescan/${studentId}?${query}`, {
      method: 'POST'
    });
  }

  // ✅ NEW: Delete PDF file and database entry
  async deletePDF(studentId, className = 'default') {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/upload/pdf/${studentId}?${query}`, {
      method: 'DELETE'
    });
  }

  // ✅ NEW: Batch delete scans with class
  async batchDeleteScans(studentIds, className = 'default') {
    return this.request('/upload/batch-delete', {
      method: 'POST',
      body: { studentIds, className }
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Utility method to convert base64 to file for upload
  base64ToFile(base64Data, filename = 'image.jpg') {
    const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    const byteCharacters = atob(base64WithoutPrefix);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'image/jpeg' });
    return new File([blob], filename, { type: 'image/jpeg' });
  }

  // ✅ UPDATED: Batch operations with class
  async batchUpdateStatus(updates, className = 'default') {
    return this.request('/students/batch/status', {
      method: 'PATCH',
      body: { updates, className }
    });
  }

  async batchGeneratePDFs(studentIds, className = 'default') {
    return this.request('/students/batch/generate-pdf', {
      method: 'POST',
      body: { studentIds, className }
    });
  }

  // ✅ NEW: Class-specific operations
  async getClassStats(className) {
    return this.request(`/classes/${className}/stats`);
  }

  async deleteClass(className) {
    return this.request(`/classes/${className}`, {
      method: 'DELETE'
    });
  }
}

// Create global instance
const apiService = new ApiService();

// Add error handling wrapper
const createApiServiceWithErrorHandling = () => {
  const handler = {
    get(target, prop) {
      const value = target[prop];
      
      if (typeof value === 'function') {
        return async function (...args) {
          try {
            console.log(`🔄 API Call: ${prop}`, args.length > 0 ? args[0] : '');
            return await value.apply(target, args);
          } catch (error) {
            console.error(`API Error in ${prop}:`, error);
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
              throw new Error('Network error: Please check server connection.');
            } else if (error.message.includes('404')) {
              throw new Error('Requested resource not found.');
            } else if (error.message.includes('500')) {
              throw new Error('Server error: Please try again later.');
            } else {
              throw error;
            }
          }
        };
      }
      
      return value;
    }
  };
  
  return new Proxy(apiService, handler);
};

export default createApiServiceWithErrorHandling();