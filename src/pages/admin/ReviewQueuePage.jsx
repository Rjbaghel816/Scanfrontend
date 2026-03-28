import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import './ReviewQueuePage.css';

const ReviewQueuePage = () => {
  const classes = useClasses();
  
  const [subjectId, setSubjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for Review Queue
  const [copies, setCopies] = useState([
    { id: '1', fictNo: 1001, className: 'BCA-1', subjectId: 'BCA101', pageCount: 28, status: 'Pending', lastUpdated: '2026-03-25T10:00:00Z', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: '2', fictNo: 1002, className: 'BCA-1', subjectId: 'BCA101', pageCount: 15, status: 'Low Exception', lastUpdated: '2026-03-25T11:30:00Z', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: '3', fictNo: 1003, className: 'BCA-1', subjectId: 'BCA101', pageCount: 35, status: 'High Exception', lastUpdated: '2026-03-25T12:15:00Z', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: '4', fictNo: 1004, className: 'BCA-1', subjectId: 'BCA101', pageCount: 28, status: 'Error', lastUpdated: '2026-03-25T09:45:00Z', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: '5', fictNo: 1005, className: 'BCA-1', subjectId: 'BCA101', pageCount: 28, status: 'Assigned', lastUpdated: '2026-03-25T14:00:00Z', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ]);

  const filteredCopies = useMemo(() => {
    return copies.filter(c => {
      const matchesSearch = String(c.fictNo).includes(searchQuery);
      const matchesSubject = subjectId === 'all' || c.subjectId === subjectId;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [copies, searchQuery, subjectId, statusFilter]);

  const handlePreview = (copy) => {
    setSelectedCopy(copy);
    setIsModalOpen(true);
  };

  const handleAccept = (id) => {
    setCopies(copies.map(c => c.id === id ? { ...c, status: 'Accepted As-Is' } : c));
  };

  return (
    <div className="review-queue-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Copy Review Queue</h1>
          <p>Preview uploaded copies and manage exceptions or errors.</p>
        </div>
      </header>

      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="all">All Subjects</option>
              {classes.availableSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Error">Error</option>
              <option value="Low Exception">Low Exception</option>
              <option value="High Exception">High Exception</option>
              <option value="Accepted As-Is">Accepted As-Is</option>
            </select>
          </div>
          <div className="filter-group search">
            <label>Search Fict No.</label>
            <div className="search-input">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="e.g. 1005" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-row">
          <span>{filteredCopies.length} copies found</span>
        </div>
        <div className="table-wrapper">
          <table className="review-table">
            <thead>
              <tr>
                <th>Fict No</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Pages</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map(copy => (
                <tr key={copy.id}>
                  <td className="font-bold">{copy.fictNo}</td>
                  <td>{copy.className}</td>
                  <td>{copy.subjectId}</td>
                  <td>{copy.pageCount}</td>
                  <td>
                    <span className={`status-pill ${copy.status.toLowerCase().replace(' ', '-')}`}>
                      {copy.status}
                    </span>
                  </td>
                  <td className="text-muted">
                    <div className="time-cell">
                      <Clock size={14} />
                      {new Date(copy.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div className="action-row">
                      <button className="btn-icon-text" onClick={() => handlePreview(copy)}>
                        <Eye size={14} /> Preview
                      </button>
                      {(copy.status.includes('Exception')) && (
                        <button className="btn-success-sm" onClick={() => handleAccept(copy.id)}>
                          Accept
                        </button>
                      )}
                      {copy.status === 'Error' && (
                        <button className="btn-warning-sm">
                          <RefreshCw size={14} /> Re-upload
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Reviewing Fict No: ${selectedCopy?.fictNo}`}
        maxWidth="1000px"
      >
        <div className="preview-modal-content">
          <div className="preview-info">
            <div className="info-item">
              <label>Roll Number</label>
              <span>{selectedCopy?.fictNo}</span>
            </div>
            <div className="info-item">
              <label>Status</label>
              <span className={`status-pill ${selectedCopy?.status.toLowerCase().replace(' ', '-')}`}>
                {selectedCopy?.status}
              </span>
            </div>
          </div>
          <div className="pdf-viewer-container">
            <iframe 
              // ✅ Fix: Use local proxy for all PDFs — avoids CSP / frame-ancestor blocking
              src={selectedCopy?.fileUrl?.startsWith('http')
                ? `${api.getBackendRoot()}/api/proxy/pdf?url=${encodeURIComponent(selectedCopy.fileUrl)}`
                : selectedCopy?.fileUrl?.startsWith('/')
                  ? `${api.getBackendRoot()}${selectedCopy.fileUrl}`
                  : selectedCopy?.fileUrl}
              title="PDF Preview"
              className="pdf-iframe"
            />
          </div>
          <footer className="preview-footer">
            <button className="btn-ghost" onClick={() => setIsModalOpen(false)}>Close</button>
            <div className="footer-actions">
               {(selectedCopy?.status.includes('Exception')) && (
                <button className="btn-primary" onClick={() => {
                  handleAccept(selectedCopy.id);
                  setIsModalOpen(false);
                }}>
                  Accept As-Is
                </button>
              )}
            </div>
          </footer>
        </div>
      </Modal>
    </div>
  );
};

export default ReviewQueuePage;
