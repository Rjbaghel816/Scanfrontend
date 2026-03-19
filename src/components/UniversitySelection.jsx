import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import AdminLogin from './AdminLogin';
import ForgotPassword from './ForgotPassword';

const UniversitySelection = () => {
  const { selectTenant } = useTenant();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  // View states: 'list', 'create', 'login', 'forgot'
  const [view, setView] = useState('list');
  const [error, setError] = useState('');
  
  const isMasterAdmin = localStorage.getItem('masterAdmin') === 'true';

  // Form State
  const [name, setName] = useState('');
  const [universityCode, setUniversityCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const res = await api.getUniversities();
      if (res.success) {
        setUniversities(res.data);
      }
    } catch (err) {
      setError('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (code) => {
    selectTenant(code);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.createUniversity(name, universityCode, adminEmail);
      if (res.success) {
        setView('list');
        fetchUniversities();
      }
    } catch (err) {
      setError(err.message || 'Failed to create university');
    }
  };

  if (loading) return <div className="spinner">Loading Universities...</div>;

  if (view === 'login') {
    return <AdminLogin 
             onLoginSuccess={() => setView('list')} 
             onGoBack={() => setView('list')} 
             onNavigateForgot={() => setView('forgot')} 
           />;
  }

  if (view === 'forgot') {
    return <ForgotPassword onGoBack={() => setView('login')} />;
  }

  if (view === 'create') {
    return (
      <div className="university-selection-container">
        <h2>Register New University</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleCreate} className="university-form">
          <input 
            type="text" 
            placeholder="University Name (e.g. Harvard)" 
            value={name} onChange={e => setName(e.target.value)} required 
          />
          <input 
            type="text" 
            placeholder="Unique Code (e.g. harvard)" 
            value={universityCode} onChange={e => setUniversityCode(e.target.value)} required 
          />
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required 
          />
          <div className="btn-group">
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="university-selection-container">
      <h2>Select Your University</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="university-grid">
        {universities.length === 0 ? (
          <p>No universities found.</p>
        ) : (
          universities.map(uni => (
             <div key={uni.universityCode} className="university-card" onClick={() => handleSelect(uni.universityCode)}>
               <h3>{uni.name}</h3>
               <small>Code: {uni.universityCode}</small>
             </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-center">
        {isMasterAdmin ? (
          <div style={{ display: 'flex', gap: '15px', justifyItems: 'center', justifyContent: 'center' }}>
            <button className="btn btn-secondary outline" onClick={() => setView('create')}>
              + Register New University
            </button>
            <button className="btn btn-secondary outline" onClick={() => {
              localStorage.removeItem('masterAdmin');
              window.location.reload();
            }} style={{ borderColor: '#e74c3c', color: '#e74c3c' }}>
              Logout Admin
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary outline" onClick={() => setView('login')} style={{ fontSize: '0.9em' }}>
            Master Admin Login
          </button>
        )}
      </div>
    </div>
  );
};

export default UniversitySelection;
