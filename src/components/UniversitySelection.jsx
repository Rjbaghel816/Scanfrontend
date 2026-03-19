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
      const res = await api.updateUniversityPassword(selectedUni._id || selectedUni.universityCode, newUniPassword);
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
            type="password" 
            placeholder="Admin Password" 
            value={password} onChange={e => setPassword(e.target.value)} required 
          />
          <div className="btn-group">
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'password') {
    return (
      <div className="university-selection-container">
        <h2>Enter Access Password</h2>
        <p style={{marginBottom: '10px'}}>{selectedUni?.name}</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleVerifyPassword} className="university-form">
          <input 
            type="password" 
            placeholder="University Password" 
            value={uniPassword} onChange={e => setUniPassword(e.target.value)} required 
          />
          <div className="btn-group">
            <button type="submit" className="btn btn-primary">Access Scanner</button>
            <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>&larr; Back</button>
          </div>
          {isMasterAdmin && (
             <button type="button" className="btn btn-secondary outline" style={{marginTop:'15px'}} onClick={() => {
               setNewUniPassword(''); 
               setView('update-password');
             }}>
               🔑 Change Password
             </button>
          )}
        </form>
      </div>
    );
  }

  if (view === 'update-password') {
    return (
      <div className="university-selection-container">
        <h2>Update Access Password</h2>
        <p style={{marginBottom: '10px'}}>{selectedUni?.name}</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleChangePassword} className="university-form">
          <input 
            type="password" 
            placeholder="Enter New Password" 
            value={newUniPassword} onChange={e => setNewUniPassword(e.target.value)} required 
          />
          <div className="btn-group">
            <button type="submit" className="btn btn-danger">Update Password</button>
            <button type="button" className="btn btn-secondary" onClick={() => setView('password')}>Cancel</button>
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
             <div key={uni.universityCode} className="university-card" onClick={() => handleSelect(uni)}>
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
