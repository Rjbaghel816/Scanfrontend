import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Key, Lock, UserCircle, ShieldCheck, Database } from 'lucide-react';
import api from '../services/api';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    
    // Core Workflow States
    const [roleType, setRoleType] = useState('user'); // 'user' | 'admin'
    const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = Reset (Admin ONLY)
    
    // Admin Flow Data
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    
    // Standard Shared Data
    const [newPassword, setNewPassword] = useState('');
    
    // University Flow Data
    const [universities, setUniversities] = useState([]);
    const [uniPayload, setUniPayload] = useState({
        university: '',
        adminEmail: '',
        adminPassword: ''
    });

    // Status states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const res = await api.getUniversities();
                if (res.success) {
                    setUniversities(res.data || []);
                    if (res.data.length > 0) {
                        setUniPayload(prev => ({ ...prev, university: res.data[0].universityCode }));
                    }
                }
            } catch (e) {
                console.error('Failed fetching universities', e);
            }
        };
        fetchUniversities();
    }, []);

    // -----------------------
    // Admin Password Reset Flow
    // -----------------------
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        
        try {
            const res = await api.sendAdminOTP(email);
            if (res.success) {
                setMessage(res.message);
                setStep(2);
            }
        } catch (err) {
            setError(err.message || 'Error sending OTP. Make sure email is correct.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        
        if (otp.length !== 4) {
            setError('OTP must be exactly 4 digits');
            setIsLoading(false);
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
            setIsLoading(false);
        }
    };

    const handleResetAdminPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            const res = await api.resetAdminPassword(email, newPassword);
            if (res.success) {
                setMessage('Master password reset successful! Redirecting...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    // -----------------------
    // University Password Reset Flow
    // -----------------------
    const handleResetUniversityPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            // Push strictly isolated remote payload (No target user string required explicitly)
            const res = await api.resetUniversityUserPassword({
                ...uniPayload,
                newPassword
            });

            if (res.success) {
                setMessage('University user password reset successful! Redirecting...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            let errorMsg = err.message || 'Failed to reset university user password';
            if (errorMsg.includes('Invalid Admin Credentials')) {
                errorMsg = 'Incorrect Master Admin password! Access denied.';
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // -----------------------
    // Interface Output
    // -----------------------
    return (
        <div className="forgot-password-page">
            <div className="forgot-card" style={{ maxWidth: roleType === 'user' ? '450px' : '400px' }}>
                <button className="btn-back" onClick={() => navigate('/login')}>
                    <ArrowLeft size={18} /> Back to Login
                </button>

                <div className="forgot-header">
                    <div className="icon-badge">
                        {roleType === 'admin' ? (
                            step === 1 ? <Mail size={32} /> : step === 2 ? <Key size={32} /> : <Lock size={32} />
                        ) : (
                            <Lock size={32} />
                        )}
                    </div>
                    <h1>
                        {roleType === 'admin' 
                            ? (step === 1 ? 'Admin Vault' : step === 2 ? 'Verify OTP' : 'Reset Vault') 
                            : 'University Vault'
                        }
                    </h1>
                    <p>
                        {roleType === 'admin' && step === 1 && 'Enter your master email address to receive an OTP.'}
                        {roleType === 'admin' && step === 2 && 'Enter the 4-digit OTP sent to your master email.'}
                        {roleType === 'admin' && step === 3 && 'Enter your new master admin password.'}
                        {roleType === 'user' && 'Verified master admins can force reset a specific university workspace here.'}
                    </p>
                </div>

                {/* Role Switcher */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f3f4f6', padding: '5px', borderRadius: '8px' }}>
                    <button 
                        type="button"
                        onClick={() => { setRoleType('user'); setError(''); setMessage(''); }}
                        style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: roleType === 'user' ? '#fff' : 'transparent', boxShadow: roleType === 'user' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: roleType === 'user' ? 'bold' : 'normal', color: roleType === 'user' ? '#1f2937' : '#6b7280' }}
                    >
                        <UserCircle size={18} /> University User
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setRoleType('admin'); setError(''); setMessage(''); setStep(1); }}
                        style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: roleType === 'admin' ? '#fff' : 'transparent', boxShadow: roleType === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: roleType === 'admin' ? 'bold' : 'normal', color: roleType === 'admin' ? '#1f2937' : '#6b7280' }}
                    >
                        <ShieldCheck size={18} /> Master Admin
                    </button>
                </div>

                {error && <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}><strong>Error:</strong> {error}</div>}
                {message && <div style={{ color: '#2e7d32', background: '#e8f5e9', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{message}</div>}

                {/* ==================================
                    ADMINISTRATION FLOW 
                ================================== */}
                {roleType === 'admin' && step === 1 && (
                    <form onSubmit={handleSendOTP} className="forgot-form">
                        <div className="form-group">
                            <label>Master Admin Email</label>
                            <div className="input-wrapper">
                                <Mail size={16} className="input-icon" />
                                <input 
                                    type="email" 
                                    placeholder="rajeshbaghel2425@gmail.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Reset OTP'} 
                            {!isLoading && <Send size={18} />}
                        </button>
                    </form>
                )}

                {roleType === 'admin' && step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="forgot-form">
                        <div className="form-group">
                            <label>4-Digit OTP</label>
                            <div className="input-wrapper">
                                <Key size={16} className="input-icon" />
                                <input 
                                    type="text" 
                                    maxLength="4"
                                    placeholder="1234" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    style={{ letterSpacing: '4px', fontWeight: 'bold' }}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Validate OTP'}
                        </button>
                    </form>
                )}

                {roleType === 'admin' && step === 3 && (
                    <form onSubmit={handleResetAdminPassword} className="forgot-form">
                        <div className="form-group">
                            <label>New Master Password</label>
                            <div className="input-wrapper">
                                <Lock size={16} className="input-icon" />
                                <input 
                                    type="password" 
                                    placeholder="Enter new master password (min 6)" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-submit" disabled={isLoading} style={{ background: '#27ae60' }}>
                            {isLoading ? 'Saving...' : 'Save New Master Password'}
                        </button>
                    </form>
                )}

                {/* ==================================
                    UNIVERSITY USER FLOW 
                ================================== */}
                {roleType === 'user' && (
                    <form onSubmit={handleResetUniversityPassword} className="forgot-form">
                        
                        <div className="form-group">
                            <label>Select Workspace / Target Tenant</label>
                            <div className="input-wrapper">
                                <Database size={16} className="input-icon" style={{ top: '35%' }} />
                                <select 
                                    value={uniPayload.university}
                                    onChange={(e) => setUniPayload({...uniPayload, university: e.target.value})}
                                    style={{ padding: '12px 15px 12px 40px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                                    required
                                >
                                    <option value="" disabled>Select University Workspace</option>
                                    {universities.map(u => (
                                        <option key={u._id} value={u.universityCode}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <hr style={{ margin: '15px 0', borderTop: '1px solid #eee' }}/>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px', fontWeight: '500' }}>Admin Clearance Verification:</p>

                        <div className="form-group">
                            <label>Master Admin Email</label>
                            <div className="input-wrapper">
                                <Mail size={16} className="input-icon" />
                                <input 
                                    type="email" 
                                    placeholder="Enter your master email natively" 
                                    value={uniPayload.adminEmail}
                                    onChange={(e) => setUniPayload({...uniPayload, adminEmail: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Master Admin Password</label>
                            <div className="input-wrapper">
                                <Key size={16} className="input-icon" />
                                <input 
                                    type="password" 
                                    placeholder="Verify clearance with Master Password" 
                                    value={uniPayload.adminPassword}
                                    onChange={(e) => setUniPayload({...uniPayload, adminPassword: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>New Workspace Passkey</label>
                            <div className="input-wrapper">
                                <Lock size={16} className="input-icon" />
                                <input 
                                    type="password" 
                                    placeholder="Enter new 6+ char passkey" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn-submit" 
                            disabled={isLoading} 
                            style={{ background: '#2563eb' }}>
                            {isLoading ? 'Processing Access...' : 'Override Vault Password'}
                        </button>

                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
