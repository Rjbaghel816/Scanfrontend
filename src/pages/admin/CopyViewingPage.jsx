import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  FileText, 
  Image as ImageIcon,
  Grid,
  List,
  MoreVertical
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import './CopyViewingPage.css';

const CopyViewingPage = () => {
  const classes = useClasses();
  const [subjectId, setSubjectId] = useState('');
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCopies = async () => {
    if (!classes.currentClass || classes.currentClass === '') return;

    setLoading(true);
    try {
      const response = await api.getCopies(classes.currentClass, subjectId || '');
      if (response.success) {
        setCopies(response.data);
      }
    } catch (error) {
      console.error('Fetch copies error:', error);
      setCopies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCopies();
  }, [classes.currentClass, subjectId]);

  const handleView = (copy) => {
    setSelectedCopy(copy);
    setIsModalOpen(true);
  };

  const handleDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="copy-viewing-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Copy Viewing System</h1>
          <p>Filter and view uploaded answer booklets.</p>
        </div>
      </header>

      <section className="filter-bar">
        <div className="filter-group">
          <label>Class Code</label>
          <select 
            value={classes.currentClass} 
            onChange={(e) => classes.changeClass(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.availableClasses.map(c => (
              <option key={c.className} value={c.className}>{c.displayName}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Subject Code</label>
          <select 
            value={subjectId} 
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">Select Subject</option>
            {classes.availableSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button className="btn-search" onClick={fetchCopies}>
          <Search size={18} /> Search
        </button>

        <div className="view-toggle">
          <button 
            className={viewMode === 'grid' ? 'active' : ''} 
            onClick={() => setViewMode('grid')}
          >
            <Grid size={18} />
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''} 
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
          </button>
        </div>
      </section>

      <main className="copies-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Searching for copies...</p>
          </div>
        ) : copies.length > 0 ? (
          <div className={`copies-${viewMode}`}>
            {copies.map(copy => (
              <div key={copy.id} className="copy-item">
                <div className="copy-preview" onClick={() => handleView(copy)}>
                  {copy.type === 'pdf' ? <FileText size={48} /> : <ImageIcon size={48} />}
                  <div className="overlay">
                    <Eye size={24} />
                    <span>View Full</span>
                  </div>
                </div>
                <div className="copy-details">
                  <div className="info">
                    <span className="roll">Roll: {copy.rollNo}</span>
                    <span className="file">{copy.fileName}</span>
                  </div>
                  <div className="actions">
                    <button onClick={() => handleDownload(copy.fileUrl, copy.fileName)}>
                      <Download size={16} />
                    </button>
                    <button>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Filter size={48} />
            <h3>No Copies Found</h3>
            <p>Please select class and subject to filter results.</p>
          </div>
        )}
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Viewing: ${selectedCopy?.fileName}`}
        maxWidth="95vw"
      >
        <div className="viewer-container">
          {selectedCopy?.type === 'pdf' ? (
            <iframe
              // ✅ FIX: Prefix with backend base URL — avoids CSP blocks on iframe src
              src={selectedCopy.fileUrl?.startsWith('/')
                ? `http://localhost:5002${selectedCopy.fileUrl}`
                : selectedCopy.fileUrl}
              title="PDF Viewer"
              className="media-viewer"
            />
          ) : (
            <img
              src={selectedCopy?.fileUrl}
              alt="Copy"
              className="media-viewer image"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CopyViewingPage;
