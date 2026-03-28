import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Eye, 
  Clock, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Download,
  Filter,
  Search
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import './StatisticsPage.css';

const StatisticsPage = () => {
  const classes = useClasses();
  const [subjectId, setSubjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock stats data
  const stats = {
    total: 1250,
    viewed: 840,
    pending: 310,
    error: 45,
    lowException: 32,
    highException: 23,
    accepted: 55
  };

  const statCards = [
    { label: 'Total Copies', value: stats.total, icon: <FileText size={20} />, color: 'blue' },
    { label: 'Viewed', value: stats.viewed, icon: <Eye size={20} />, color: 'emerald' },
    { label: 'Pending', value: stats.pending, icon: <Clock size={20} />, color: 'slate' },
    { label: 'In Error', value: stats.error, icon: <AlertCircle size={20} />, color: 'red' },
    { label: 'Low Exception', value: stats.lowException, icon: <TrendingDown size={20} />, color: 'amber' },
    { label: 'High Exception', value: stats.highException, icon: <TrendingUp size={20} />, color: 'orange' },
    { label: 'Accepted As-Is', value: stats.accepted, icon: <CheckCircle2 size={20} />, color: 'green' },
    { label: 'Unviewed', value: stats.total - stats.viewed, icon: <Eye size={20} />, color: 'violet' },
  ];

  return (
    <div className="statistics-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Answer Booklet Statistics</h1>
          <p>Track upload counts, exceptions, and copy status across all classes.</p>
        </div>
        <button className="btn-export">
          <Download size={16} /> Export CSV
        </button>
      </header>

      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className={`stat-card ${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <span className="stat-value">{card.value.toLocaleString()}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="filter-section">
        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-group">
              <label>Class</label>
              <select value={classes.currentClass} onChange={(e) => classes.changeClass(e.target.value)}>
                <option value="all">All Classes</option>
                {classes.availableClasses.map(c => (
                  <option key={c.className} value={c.className}>{c.displayName}</option>
                ))}
              </select>
            </div>
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
                <option value="Error">Error</option>
                <option value="Exception">Exception</option>
              </select>
            </div>
            <button className="btn-apply">Apply Filters</button>
          </div>
        </div>
      </section>

      <div className="main-charts-row">
        <div className="chart-placeholder-card">
          <h3>Upload Distribution by Class</h3>
          <div className="mock-bar-chart">
            {[65, 45, 85, 30, 55].map((h, i) => (
              <div key={i} className="bar-wrapper">
                <div className="bar" style={{ height: `${h}%` }}>
                  <div className="bar-tooltip">{h}%</div>
                </div>
                <span className="bar-label">C-{i+1}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-placeholder-card">
          <h3>Status Breakdown</h3>
          <div className="mock-pie-chart">
            <div className="pie-segment p1"></div>
            <div className="pie-segment p2"></div>
            <div className="pie-segment p3"></div>
            <div className="pie-center">
              <strong>{stats.total}</strong>
              <span>Total</span>
            </div>
          </div>
          <div className="pie-legend">
            <div className="legend-item"><span className="dot p1"></span> Viewed</div>
            <div className="legend-item"><span className="dot p2"></span> Pending</div>
            <div className="legend-item"><span className="dot p3"></span> Exceptions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
