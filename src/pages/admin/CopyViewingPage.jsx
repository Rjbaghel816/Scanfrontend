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
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  MessageSquare
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import { useTenant } from '../../context/TenantContext';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import './CopyViewingPage.css';

const CopyViewingPage = () => {
  const { tenantId, isInitialized } = useTenant();
  const classes = useClasses();
  const [subjectId, setSubjectId] = useState('');
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState(''); // Review Status filter
  const [stats, setStats] = useState(null);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemNote, setProblemNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchCopies = async () => {
    // ✅ CRITICAL: Do NOT fetch API if tenant context OR class is missing
    if (!isInitialized || !tenantId) {
      console.warn('[API GUARD] Fetch prevented: Tenant not initialized yet.');
      return;
    }
    
    if (!classes.currentClass || classes.currentClass === '' || classes.currentClass === 'default') {
      return;
    }

    setLoading(true);
    try {
      console.log(`[API CALL] Fetching copies for class ${classes.currentClass} in tenant ${tenantId}`);
      const response = await api.getCopies(classes.currentClass, subjectId || '', filterStatus);
      if (response.success) {
        setCopies(response.data);
      }
      
      // Also fetch stats for the cards
      const statsRes = await api.getStats(classes.currentClass, subjectId || '');
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (error) {
      console.error('Fetch copies error:', error.message);
      setCopies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && tenantId) {
      fetchCopies();
    }
  }, [isInitialized, tenantId, classes.currentClass, subjectId, filterStatus]);

  // Show global loader if we don't have a tenant context yet
  if (!isInitialized) {
    return <div className="loading-state full-page"><div className="spinner"></div><p>Initializing Session...</p></div>;
  }

  const handleView = async (copy) => {
    setSelectedCopy(copy);
    setIsModalOpen(true);

    // Mark as viewed if not already marked (works for both 'NOT_VIEWED' and missing 'undefined' status)
    if (copy.reviewStatus !== 'VIEWED' && copy.reviewStatus !== 'PROBLEM_MARKED') {
      try {
        const res = await api.markAsViewed(copy.id, classes.currentClass);
        if (res.success) {
          // Update local state instantly
          setCopies(prev => prev.map(c => 
            c.id === copy.id ? { ...c, reviewStatus: 'VIEWED', viewedAt: res.student.viewedAt } : c
          ));
          // Refresh stats
          const statsRes = await api.getStats(classes.currentClass, subjectId || '');
          if (statsRes.success) setStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Auto-view update failed:', err);
      }
    }
  };

  const handleMarkProblem = async () => {
    if (!selectedCopy) return;
    setSavingStatus(true);
    try {
      const res = await api.markProblem(selectedCopy.id, classes.currentClass, problemNote);
      if (res.success) {
        setCopies(prev => prev.map(c => 
          c.id === selectedCopy.id ? { ...c, reviewStatus: 'PROBLEM_MARKED', problemNote } : c
        ));
        setIsProblemModalOpen(false);
        setProblemNote('');
        
        // Refresh stats
        const statsRes = await api.getStats(classes.currentClass, subjectId || '');
        if (statsRes.success) setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Mark problem error:', err);
    } finally {
      setSavingStatus(false);
    }
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

      {/* Review Stats Cards */}
      {stats && (
        <section className="review-stats-row">
          <div className="stat-card total">
            <div className="stat-icon"><LayoutDashboard size={20} /></div>
            <div className="stat-info">
              <span className="count">{stats.scanned}</span>
              <span className="label">Total Scans</span>
            </div>
          </div>
          <div className="stat-card not-viewed">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-info">
              <span className="count">{stats.notViewedCount}</span>
              <span className="label">Not Viewed</span>
            </div>
          </div>
          <div className="stat-card viewed">
            <div className="stat-icon"><CheckCircle size={20} /></div>
            <div className="stat-info">
              <span className="count">{stats.viewedCount}</span>
              <span className="label">Reviewed</span>
            </div>
          </div>
          <div className="stat-card problem">
            <div className="stat-icon"><AlertTriangle size={20} /></div>
            <div className="stat-info">
              <span className="count">{stats.problemMarkedCount}</span>
              <span className="label">Problems Marked</span>
            </div>
          </div>
        </section>
      )}

      {/* Status Filter Tab Bar */}
      <section className="type-filter-bar">
        <button 
          className={filterStatus === '' ? 'active' : ''} 
          onClick={() => setFilterStatus('')}
        >
          All Scans
        </button>
        <button 
          className={`filter-btn not-viewed ${filterStatus === 'NOT_VIEWED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('NOT_VIEWED')}
        >
          Not Viewed
        </button>
        <button 
          className={`filter-btn viewed ${filterStatus === 'VIEWED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('VIEWED')}
        >
          Verified
        </button>
        <button 
          className={`filter-btn problem ${filterStatus === 'PROBLEM_MARKED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('PROBLEM_MARKED')}
        >
          Flagged
        </button>
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
              <div key={copy.id} className={`copy-item review-status-${copy.reviewStatus?.toLowerCase()}`}>
                <div className="copy-preview" onClick={() => handleView(copy)}>
                  <div className={`status-badge ${copy.reviewStatus?.toLowerCase()}`}>
                    {copy.reviewStatus === 'NOT_VIEWED' && <Clock size={12} />}
                    {copy.reviewStatus === 'VIEWED' && <CheckCircle size={12} />}
                    {copy.reviewStatus === 'PROBLEM_MARKED' && <AlertTriangle size={12} />}
                    <span>{copy.reviewStatus?.replace('_', ' ')}</span>
                  </div>
                  {copy.type === 'pdf' ? <FileText size={48} /> : <ImageIcon size={48} />}
                  <div className="overlay">
                    <Eye size={24} />
                    <span>Open Booklet</span>
                  </div>
                </div>
                <div className="copy-details">
                  <div className="info">
                    <span className="roll">Roll: {copy.rollNo}</span>
                    <span className="sub">{copy.subCode}</span>
                  </div>
                  <div className="actions">
                    <button 
                      className={`btn-action view ${copy.reviewStatus}`}
                      onClick={() => handleView(copy)}
                      title="View Copy"
                    >
                      <Eye size={16} />
                    </button>
                    {(copy.reviewStatus === 'VIEWED' || copy.reviewStatus === 'PROBLEM_MARKED') && (
                      <button 
                        className={`btn-action problem ${copy.reviewStatus === 'PROBLEM_MARKED' ? 'active' : ''}`}
                        onClick={() => { setSelectedCopy(copy); setIsProblemModalOpen(true); }}
                        title="Mark Problem"
                      >
                        <AlertTriangle size={16} />
                      </button>
                    )}
                    <button className="btn-action more" title="More Options">
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

      {/* Problem Report Modal */}
      <Modal
        isOpen={isProblemModalOpen}
        onClose={() => { setIsProblemModalOpen(false); setProblemNote(''); }}
        title="Mark Copy Problem"
        maxWidth="500px"
      >
        <div className="problem-report-container">
          <p className="instruction">Please specify the issue found in this answer booklet. This will flag the copy for supervisor review.</p>
          <div className="form-group">
            <label>Reason / Note</label>
            <textarea 
              placeholder="Enter details about the problem (e.g. Malpractice, Blank Copy, Incomplete, etc.)"
              value={problemNote}
              onChange={(e) => setProblemNote(e.target.value)}
              rows={4}
            />
          </div>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setIsProblemModalOpen(false)}>Cancel</button>
            <button 
              className={`btn-submit ${savingStatus ? 'loading' : ''}`}
              onClick={handleMarkProblem}
              disabled={savingStatus}
            >
              {savingStatus ? 'Saving...' : 'Confirm Problem'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CopyViewingPage;
