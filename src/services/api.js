// Base URL for backend API
// - Defaults to local Express server on port 5000 (see `server.js`)
// - Can be overridden at build time via REACT_APP_API_BASE
const API_BASE =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  'http://localhost:5002/api';

class ApiService {
  getBackendRoot() {
    return API_BASE.replace('/api', '');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const isFormData = options.body instanceof FormData;
    
    // ✅ Multi-Tenant: Fetch Tenant ID and Auth Token from localStorage
    const tenantId = localStorage.getItem('tenantId');
    const token = localStorage.getItem('token');

    // Define endpoints that do NOT require a tenant ID (Public or Global Admin routes)
    const publicEndpoints = [
      '/auth/login',
      '/admin/login',
      '/universities',
      '/health',
      '/admin/send-otp',
      '/admin/verify-otp',
      '/admin/reset-password'
    ];

    const isPublic = publicEndpoints.some(path => endpoint.startsWith(path));

    // ✅ REQUIREMENT: Throw proper readable error if tenantId is missing for non-public routes
    if (!tenantId && !isPublic) {
      console.error(`[API ERROR] Missing tenantId for endpoint: ${endpoint}`);
      throw new Error('University/Tenant context is missing. Please select a University from the portal.');
    }

    console.log(`[API] ${options.method || 'GET'} to:`, endpoint, '| tenantId:', tenantId);

    const headers = { ...options.headers };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    
    // ✅ REQUIREMENT: Ensure x-tenant-id header is included automatically
    if (tenantId) headers['x-tenant-id'] = tenantId;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
      headers,
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
          // Special handling for multi-tenant errors from backend
          if (response.status === 400 && data.message?.includes('tenant')) {
            throw new Error('Session Expired: Please select your university again.');
          }
          throw new Error(data.message || 'API request failed');
        }

        return data;
      } else {
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Download failed');
          } catch {
            throw new Error(`Request failed with status ${response.status}`);
          }
        }
        return response;
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ✅ NEW: Master DB / Authentication APIs
  async getUniversities(params = {}) {
    return this.request('/universities');
  }

  async createUniversity(name, universityCode, password) {
    return this.request('/admin/create-university', {
      method: 'POST',
      body: { name, universityCode, password }
    });
  }

  // ✅ NEW: Password Protection for Universities
  async verifyUniversityPassword(universityId, password) {
    return this.request('/universities/verify-password', {
      method: 'POST',
      body: { universityId, password }
    });
  }

  async updateUniversityPassword(universityId, newPassword, role) {
    return this.request(`/universities/${universityId}/update-password`, {
      method: 'PUT',
      body: { newPassword, role }
    });
  }

  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { username, password }
    });
  }

  // ✅ NEW: Super Admin Auth APIs
  async adminLogin(email, password) {
    return this.request('/admin/login', {
      method: 'POST',
      body: { email, password }
    });
  }

  async sendAdminOTP(email) {
    return this.request('/admin/send-otp', {
      method: 'POST',
      body: { email }
    });
  }
  
  async verifyAdminOTP(email, otp) {
    return this.request('/admin/verify-otp', {
      method: 'POST',
      body: { email, otp }
    });
  }

  async resetAdminPassword(email, newPassword) {
    return this.request('/admin/reset-password', {
      method: 'POST',
      body: { email, newPassword }
    });
  }

  // ✅ NEW: Specifically isolated reset system for standard university users
  async resetUniversityUserPassword(payload) {
    return this.request('/university/reset-password', {
      method: 'POST',
      body: payload
    });
  }

  // ✅ NEW: Fetch remote users assigned explicitly mapping over a particular tenant
  async getUniversityUsers(universityCode) {
    return this.request(`/universities/users?university=${universityCode}`);
  }

  // ✅ NEW: Get all available classes
  async getClasses() {
    return this.request('/students/classes');
  }

  // ✅ NEW: Create a new class (persists collection to MongoDB)
  async createClass(className) {
    return this.request('/students/classes', {
      method: 'POST',
      body: { className }
    });
  }

  // ✅ NEW: Get unique subjects for a specific class
  async getSubjects(className) {
    const query = new URLSearchParams({ className }).toString();
    return this.request(`/students/subjects?${query}`);
  }

  // ✅ NEW: Manually register a new subject for a class
  async createSubject(className, subjectCode) {
    return this.request('/students/subjects', {
      method: 'POST',
      body: { className, subjectCode }
    });
  }

  // ✅ FIXED: Fetch scanned copies for a class/subject with optional reviewStatus filter
  async getCopies(className, subject = '', reviewStatus = '') {
    return this.request('/getCopies', {
      method: 'POST',
      body: { className, ...(subject && { subject }), ...(reviewStatus && { reviewStatus }) }
    });
  }

  // ✅ NEW: Get paper config for class/subject
  async getPaperConfig(className, subjectCode) {
    const query = new URLSearchParams({ className, subjectCode }).toString();
    return this.request(`/papers/config?${query}`);
  }

  // ✅ NEW: Get all papers for a class (Question Papers or Answer Templates)
  async getPapers(className, type = 'question-paper') {
    const query = new URLSearchParams({ className, type }).toString();
    const endpoint = type === 'answer-template' ? '/papers/answer-templates' : '/papers/question-papers';
    return this.request(`${endpoint}?${query}`);
  }

  /**
   * ✅ NEW: Upload paper config with files (Question Paper PDF & Answer Template)
   * formData should include questionPaper and answerTemplate files if selected
   */
  async savePaperConfig(formData) {
    console.log('📤 Uploading paper configuration and files...');
    return this.request('/papers/upload', {
      method: 'POST',
      body: formData // multipart/form-data
    });
  }

  // ✅ UPDATED: Get students with class & subject parameter
  async getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/students?${query}`);
  }

  async getStudent(studentId, className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/students/${studentId}?${query}`);
  }

  // ✅ UPDATED: Update student status with class & subject
  async updateStudentStatus(studentId, status, remark = '', className = 'default', subject = '') {
    return this.request(`/students/${studentId}/status`, {
      method: 'PATCH',
      body: { status, remark, className, subject }
    });
  }

  // ✅ UPDATED: Update student remark with class & subject
  async updateStudentRemark(studentId, remark, className = 'default', subject = '') {
    return this.request(`/students/${studentId}/remark`, {
      method: 'PATCH',
      body: { remark, className, subject }
    });
  }

  // ✅ FIXED: Routes through centralized request() so x-tenant-id is always injected
  async uploadExcelWithClass(formData, className = 'default') {
    console.log('📤 Uploading Excel file for class:', className);

    // Ensure className is appended once cleanly
    if (formData.has('className')) {
      formData.delete('className');
    }
    if (className && className !== 'default') {
      formData.append('className', className);
    }

    // ✅ Use this.request() — NOT raw fetch — so the interceptor injects x-tenant-id header
    return this.request('/students/upload-excel', {
      method: 'POST',
      body: formData, // FormData is detected by `isFormData` check; Content-Type is NOT set manually
    });
  }

  // ✅ UPDATED: Delete student with class & subject
  async deleteStudent(studentId, className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/students/${studentId}?${query}`, {
      method: 'DELETE'
    });
  }

  async deleteAllStudents(className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/students?${query}`, {
      method: 'DELETE'
    });
  }

  // ✅ FIXED: Upload scans with class & subject
  async uploadScans(studentId, formData, className = 'default', subject = '') {
    // Clean up duplicate fields before sending
    if (formData.has('className')) formData.delete('className');
    if (formData.has('subject')) formData.delete('subject');

    if (className && className !== 'default') formData.append('className', className);
    if (subject) formData.append('subject', subject);

    // ✅ FIXED: Use this.request() so x-tenant-id header is injected automatically
    return this.request(`/upload/scan/${studentId}`, {
      method: 'POST',
      body: formData, // FormData detected by isFormData check — browser sets multipart boundary
    });
  }

  // ✅ UPDATED: Delete scans with class & subject
  async deleteScans(studentId, className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/upload/scan/${studentId}?${query}`, {
      method: 'DELETE'
    });
  }

  // ✅ FIXED: Generate PDF with class & subject — injects x-tenant-id manually (blob response)
  async generatePDF(studentId, className = 'default', subject = '') {
    try {
      const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();

      // ✅ Build headers the same way request() does, so x-tenant-id is always present
      const tenantId = localStorage.getItem('tenantId');
      const token = localStorage.getItem('token');
      const headers = {};
      if (tenantId) headers['x-tenant-id'] = tenantId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('[API] generatePDF | tenantId:', tenantId);

      const response = await fetch(`${API_BASE}/students/${studentId}/generate-pdf?${query}`, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'PDF generation failed');
      }

      // Parse Content-Disposition for filename
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Copy_${studentId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Trigger browser download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Download PDF with class & subject
  async downloadPDF(studentId, className = 'default', subject = '') {
    try {
      // 1. Get PDF Info first to check path
      const infoResponse = await this.getPDFInfo(studentId, className, subject);
      const pdfPath = infoResponse.pdfInfo.pdfPath;

      let fetchUrl;
      const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();

      // 2. If remote URL (DO Spaces), use PROXY
      if (pdfPath && pdfPath.startsWith('http')) {
        console.log('🌍 Remote PDF detected, using Proxy:', pdfPath);
        fetchUrl = `${API_BASE}/proxy/pdf?url=${encodeURIComponent(pdfPath)}`;
      } else {
        // 3. Local file, use standard endpoint
        fetchUrl = `${API_BASE}/upload/pdf/${studentId}?${query}`;
      }

      const response = await fetch(fetchUrl);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'PDF download failed');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Copy_${studentId}.pdf`;

      // Try to get filename from PDF info first (most reliable)
      if (infoResponse && infoResponse.pdfInfo && infoResponse.pdfInfo.pdfName) {
        filename = infoResponse.pdfInfo.pdfName;
      }

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
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

  // ✅ UPDATED: Get stats with class & subject (Includes Review tracking counts)
  async getStats(className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/students/stats/summary?${query}`);
  }

  // ✅ NEW: Review Tracking APIs
  async markAsViewed(id, className = 'default') {
    return this.request(`/copy/${id}/view`, {
      method: 'PATCH',
      body: { className }
    });
  }

  async markProblem(id, className = 'default', problemNote = '') {
    return this.request(`/copy/${id}/problem`, {
      method: 'PATCH',
      body: { className, problemNote }
    });
  }

  // ✅ NEW: Get PDF info with class & subject
  async getPDFInfo(studentId, className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/upload/pdf/${studentId}/info?${query}`);
  }

  // ✅ NEW: Rescan student with class & subject
  async rescanStudent(studentId, className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/upload/rescan/${studentId}?${query}`, {
      method: 'POST'
    });
  }

  // ✅ NEW: Delete PDF file and database entry
  async deletePDF(studentId, className = 'default', subject = '') {
    const query = new URLSearchParams({ className, ...(subject && { subject }) }).toString();
    return this.request(`/upload/pdf/${studentId}?${query}`, {
      method: 'DELETE'
    });
  }

  // ✅ NEW: Batch delete scans with class & subject
  async batchDeleteScans(studentIds, className = 'default', subject = '') {
    return this.request('/upload/batch-delete', {
      method: 'POST',
      body: { studentIds, className, subject }
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

  // ✅ UPDATED: Batch operations with class & subject
  async batchUpdateStatus(updates, className = 'default', subject = '') {
    return this.request('/students/batch/status', {
      method: 'PATCH',
      body: { updates, className, subject }
    });
  }

  async batchGeneratePDFs(studentIds, className = 'default', subject = '') {
    return this.request('/students/batch/generate-pdf', {
      method: 'POST',
      body: { studentIds, className, subject }
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

      if (typeof value === 'function' && prop !== 'getBackendRoot') {
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