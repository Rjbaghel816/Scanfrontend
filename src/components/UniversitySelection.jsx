import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import AdminLogin from './AdminLogin';
import ForgotPassword from './ForgotPassword';

const UniversitySelection = () => {
  const { selectTenant } = useTenant();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [error, setError] = useState('');
  
  const isMasterAdmin = localStorage.getItem('role') === 'admin';

  // Form State
  const [name, setName] = useState('');
  const [universityCode, setUniversityCode] = useState('');
  const [password, setPassword] = useState('');
  
  // Access State
  const [selectedUni, setSelectedUni] = useState(null);
  const [uniPassword, setUniPassword] = useState('');
  const [newUniPassword, setNewUniPassword] = useState('');

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

  const handleSelect = (uni) => {
    setSelectedUni(uni);
    setUniPassword('');
    setError('');
    setView('password');
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.verifyUniversityPassword(selectedUni.universityCode, uniPassword);
      if (res.success) {
        localStorage.setItem('role', 'user');
        localStorage.setItem('accessGranted', 'true');
        selectTenant(selectedUni.universityCode);
      }
    } catch (err) {
      setError(err.message || 'Incorrect password');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const role = localStorage.getItem('role');
      const res = await api.updateUniversityPassword(selectedUni._id || selectedUni.universityCode, newUniPassword, role);
      if (res.success) {
        alert('Password updated successfully');
        setView('list');
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.createUniversity(name, universityCode, password);
      if (res.success) {
        setView('list');
        fetchUniversities();
      }
    } catch (err) {
      setError(err.message || 'Failed to create university');
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('role');
    window.location.reload();
  };

  if (loading) return <div className="spinner" style={{ margin: '50px auto' }}>Loading Universities...</div>;

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

  return (
    <div className="portal-wrapper">
      {/* 1. Clean Navbar */}
      <nav className="portal-navbar">
        <div className="nav-left">
          <h2 className="portal-brand">🏢 Micronic Scanner</h2>
        </div>
        <div className="nav-right">
          {isMasterAdmin && (
            <>
              {view === 'password' && (
                <button className="nav-btn btn-outline-warning" onClick={() => { setNewUniPassword(''); setView('update-password'); }}>
                  🔑 Change Password
                </button>
              )}
              <button className="nav-btn btn-outline-danger" onClick={handleLogoutAdmin}>
                🚪 Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="portal-content">
        {/* VIEW: UNIVERSITY LIST */}
        {view === 'list' && (
          <div className="portal-card">
            <h2 className="section-title">Select Your University</h2>
            <p className="section-subtitle">Choose your campus to access the scanning dashboard.</p>
            {error && <div className="alert-error">{error}</div>}
            
            <div className="uni-grid-modern">
              {universities.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>No universities found.</p>
              ) : (
                universities.map(uni => (
                  <div key={uni.universityCode} className="uni-card-modern" onClick={() => handleSelect(uni)}>
                    <div className="uni-card-icon">🏛️</div>
                    <div className="uni-card-info">
                      <h3>{uni.name}</h3>
                      <small>CODE: {uni.universityCode.toUpperCase()}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="admin-footer-controls">
              {isMasterAdmin ? (
                <div className="admin-panel">
                  <h4>Admin Controls</h4>
                  <button className="btn-modern btn-primary-gradient" onClick={() => setView('create')}>
                    + Register New University
                  </button>
                </div>
              ) : (
                <button className="btn-text-link" onClick={() => setView('login')}>
                  Master Admin Login
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW: PASSWORD PROMPT */}
        {view === 'password' && (
          <div className="auth-card">
            <div className="auth-icon">🔒</div>
            <h2 className="auth-title">Access {selectedUni?.name}</h2>
            <p className="auth-subtitle">Enter the university password to continue</p>
            {error && <div className="alert-error">{error}</div>}
            
            <form onSubmit={handleVerifyPassword} className="auth-form">
              <input 
                type="password" 
                className="modern-input"
                placeholder="Enter Password..." 
                value={uniPassword} 
                onChange={e => setUniPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-modern btn-large btn-success">
                🚀 Access Scanner
              </button>
              <button type="button" className="btn-modern btn-large btn-ghost" onClick={() => setView('list')}>
                &larr; Back to Selection
              </button>
            </form>
          </div>
        )}

        {/* VIEW: CHANGE PASSWORD */}
        {view === 'update-password' && (
          <div className="auth-card">
            <div className="auth-icon">🔑</div>
            <h2 className="auth-title">Update Password</h2>
            <p className="auth-subtitle">Set a new access password for {selectedUni?.name}</p>
            {error && <div className="alert-error">{error}</div>}
            
            <form onSubmit={handleChangePassword} className="auth-form">
              <input 
                type="password" 
                className="modern-input"
                placeholder="New Password" 
                value={newUniPassword} 
                onChange={e => setNewUniPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-modern btn-large btn-danger">
                Update Password
              </button>
              <button type="button" className="btn-modern btn-large btn-ghost" onClick={() => setView('password')}>
                Wait, Go Back
              </button>
            </form>
          </div>
        )}

        {/* VIEW: CREATE UNIVERSITY */}
        {view === 'create' && (
          <div className="auth-card">
            <div className="auth-icon">✨</div>
            <h2 className="auth-title">Register University</h2>
            <p className="auth-subtitle">Provision a new multi-tenant database</p>
            {error && <div className="alert-error">{error}</div>}
            
            <form onSubmit={handleCreate} className="auth-form">
              <input 
                type="text" 
                className="modern-input"
                placeholder="University Name (e.g. Harvard)" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                className="modern-input"
                placeholder="Unique Code (e.g. harvard)" 
                value={universityCode} 
                onChange={e => setUniversityCode(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                className="modern-input"
                placeholder="Access Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-modern btn-large btn-primary-gradient">
                Create & Initialize
              </button>
              <button type="button" className="btn-modern btn-large btn-ghost" onClick={() => setView('list')}>
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversitySelection;
