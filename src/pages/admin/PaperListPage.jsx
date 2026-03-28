import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Eye, 
  Calendar, 
  BookOpen,
  Filter,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import api from '../../services/api';
import './PaperListPage.css';

const PaperListPage = ({ defaultType = 'question-paper' }) => {
  const classes = useClasses();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState(defaultType); // Use prop for default

  // Auto-fetch papers when class OR type changes
  useEffect(() => {
    if (classes.currentClass && classes.currentClass !== 'default') {
      fetchPapers(classes.currentClass, filterType);
    } else {
      setPapers([]);
    }
  }, [classes.currentClass, filterType]);

  const fetchPapers = async (className, type) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔍 Fetching ${type} for class:`, className);
      const response = await api.getPapers(className, type);
      if (response.success) {
        setPapers(response.data);
      } else {
        throw new Error(response.message || `Failed to fetch ${type}`);
      }
    } catch (err) {
      console.error('Error fetching papers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPaper = (fileUrl) => {
    if (!fileUrl) {
      alert('PDF link not available.');
      return;
    }

    const absoluteUrl = fileUrl.startsWith('http') 
      ? fileUrl 
      : `${api.getBackendRoot()}${fileUrl}`;
    
    window.open(absoluteUrl, '_blank');
  };

  return (
    <div className="paper-list-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Document Repository</h1>
          <p>Access and view all uploaded {filterType === 'question-paper' ? 'question papers' : 'answer templates'} for the selected class.</p>
        </div>
      </header>

      <div className="list-controls-card">
        <div className="class-selector-wrapper">
          <label><Filter size={16} /> Select Class</label>
          <select 
            value={classes.currentClass} 
            onChange={(e) => classes.changeClass(e.target.value)}
            className="modern-select"
          >
            <option value="">Select Class</option>
            {classes.availableClasses.map(c => (
              <option key={c.className} value={c.className}>{c.displayName}</option>
            ))}
          </select>
        </div>
        
        {/* Toggle between Question Papers and Answer Templates */}
        <div className="type-toggle-wrapper">
          <button 
            className={`toggle-btn ${filterType === 'question-paper' ? 'active' : ''}`}
            onClick={() => setFilterType('question-paper')}
          >
            Question Papers
          </button>
          <button 
            className={`toggle-btn ${filterType === 'answer-template' ? 'active' : ''}`}
            onClick={() => setFilterType('answer-template')}
          >
            Answer Templates
          </button>
        </div>

        <div className="search-status">
          {loading && <div className="loading-spinner-sm"></div>}
          {!loading && papers.length > 0 && (
            <span className="results-count">Found {papers.length} Results</span>
          )}
        </div>
      </div>

      <div className="papers-grid">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Scanning repository...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={() => fetchPapers(classes.currentClass)}>Try Again</button>
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No {filterType === 'question-paper' ? 'Question Papers' : 'Answer Templates'}</h3>
            <p>
              {classes.currentClass 
                ? `No documents of this type have been uploaded for ${classes.currentClass} yet.` 
                : "Please select a class to view available documents."}
            </p>
          </div>
        ) : (
          papers.map((paper) => (
            <div key={paper.id} className="paper-card pulse-on-hover">
              <div className="paper-card-main">
                <div className={`paper-icon ${filterType}`}>
                  {filterType === 'question-paper' ? <FileText size={24} /> : <BookOpen size={24} />}
                </div>
                <div className="paper-details">
                  <h3>{paper.subjectCode}</h3>
                  <div className="paper-meta">
                    <span className="meta-item">
                      <BookOpen size={14} /> {paper.examType}
                    </span>
                    <span className="meta-item">
                      <Calendar size={14} /> {new Date(paper.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="paper-card-footer">
                <div className="status-indicator">
                  <span className={`status-dot ${paper.status}`}></span>
                  <span className="status-text">{paper.status.replace('_', ' ')}</span>
                </div>
                <button 
                  className="btn-view-paper"
                  onClick={() => handleViewPaper(paper.fileUrl)}
                >
                  View PDF <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PaperListPage;
