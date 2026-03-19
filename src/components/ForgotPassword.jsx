import React, { useState } from 'react';
import api from '../services/api';

const ForgotPassword = ({ onGoBack }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter New Password
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setMessage(res.message);
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Error finding account');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.resetAdminPassword(email, newPassword);
      if (res.success) {
        setMessage('Password successfully reset! You can now login.');
        setTimeout(() => onGoBack(), 2000); // Route back to login
      }
    } catch (err) {
      setError(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
           <button className="back-btn" onClick={onGoBack}>&larr; Back to Login</button>
           <h2>Forgot Password</h2>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{message}</p>}

        {step === 1 ? (
          <form onSubmit={handleRequestReset} className="login-form">
            <p style={{fontSize: '0.9em', color: '#666'}}>Enter your Master Admin Email to receive a reset link.</p>
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Request Reset'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="login-form">
            <p style={{fontSize: '0.9em', color: '#666'}}>Your reset request has been validated. Enter your new password below.</p>
            <input 
              type="password" 
              placeholder="New Password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
