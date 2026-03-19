import React, { useState } from 'react';
import api from '../services/api';

const AdminLogin = ({ onLoginSuccess, onGoBack, onNavigateForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.adminLogin(email, password);
      if (res.success) {
        localStorage.setItem('masterAdmin', 'true');
        onLoginSuccess();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
           <button className="back-btn" onClick={onGoBack}>&larr; Back</button>
           <h2>Master Admin Login</h2>
        </div>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
           <input 
             type="email" 
             placeholder="Admin Email (e.g. rajeshbaghel...)" 
             value={email} 
             onChange={e => setEmail(e.target.value)} 
             required 
           />
           <input 
             type="password" 
             placeholder="Password" 
             value={password} 
             onChange={e => setPassword(e.target.value)} 
             required 
           />
           <button type="submit" className="btn btn-primary" disabled={loading}>
             {loading ? 'Logging in...' : 'Login As Super Admin'}
           </button>
           
           <button type="button" className="btn btn-secondary outline" onClick={onNavigateForgot} style={{ marginTop: '10px' }}>
             Forgot Password?
           </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
