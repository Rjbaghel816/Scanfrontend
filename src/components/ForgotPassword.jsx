import React, { useState } from 'react';
import api from '../services/api';

const ForgotPassword = ({ onGoBack }) => {
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = New Password
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // STEP 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (email !== 'rajeshbaghel2425@gmail.com') {
      setError('Invalid admin email');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.sendAdminOTP(email);
      if (res.success) {
        setMessage(res.message);
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    if (otp.length !== 4) {
      setError('OTP must be exactly 4 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await api.verifyAdminOTP(email, otp);
      if (res.success) {
        setMessage('OTP Verified successfully!');
        setStep(3);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await api.resetAdminPassword(email, newPassword);
      if (res.success) {
        setMessage('Password successfully reset! Returning to login...');
        setTimeout(() => onGoBack(), 2000); // Route back to login after 2s
      }
    } catch (err) {
      setError(err.message || 'Error resting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
           <button className="back-btn" onClick={onGoBack}>&larr; Back to Login</button>
           <h2>Account Recovery</h2>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message" style={{ color: '#27ae60', background: '#e8f8f5', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{message}</p>}

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="login-form">
            <p style={{fontSize: '0.9em', color: '#666'}}>Enter the registered Master Admin Email (`rajeshbaghel2425@gmail.com`) to request an OTP code.</p>
            <input 
              type="email" 
              placeholder="Admin Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Transmitting...' : 'Send OTP via Email'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="login-form">
            <p style={{fontSize: '0.9em', color: '#666'}}>A 4-digit recovery code has been dispatched. It will expire in 5 minutes.</p>
            <input 
              type="text" 
              maxLength="4"
              style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.2em' }}
              placeholder="1234" 
              value={otp} 
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} // Restrict to numbers only
              required 
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Validate OTP'}
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="login-form">
            <p style={{fontSize: '0.9em', color: '#666'}}>Authentication bypassed successfully. Please configure your new Master Password.</p>
            <input 
              type="password" 
              placeholder="Enter New Password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
            />
            <button type="submit" className="btn btn-primary" style={{ background: '#27ae60' }} disabled={loading}>
              {loading ? 'Securing...' : 'Encrypt & Save Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
