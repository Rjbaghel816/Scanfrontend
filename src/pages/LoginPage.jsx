import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Lock, Mail, User, ArrowRight, UserCircle, ShieldCheck } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const { login, tenantId, universities, selectTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [roleType, setRoleType] = useState('user'); // 'user' or 'admin'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log(`[AUTH LOG] Initiating login flow for role: ${roleType.toUpperCase()}`);
      console.log(`[AUTH LOG] Target Endpoint: ${roleType === 'admin' ? '/api/admin/login' : '/api/auth/login'}`);
      
      const res = await login(identifier, password, roleType);
      
      console.log(`[AUTH LOG] Login Successful. Retrieved Payload:`, res.data);
      
      if (res.success) {
        // Redirect based on role
        const role = res.data.role;
        if (role === 'admin' || role === 'operator') {
          navigate('/admin/dashboard');
        } else {
          navigate('/scanner');
        }
      }
    } catch (err) {
      console.error(`[AUTH LOG] Login Failed:`, err.message);
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <LayoutDashboard size={32} />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your Digital Evaluation account</p>
        </div>

        {/* 🌟 BONUS: Role Selector UI */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f3f4f6', padding: '5px', borderRadius: '8px' }}>
          <button 
            type="button"
            onClick={() => { setRoleType('user'); setError(''); }}
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: roleType === 'user' ? '#fff' : 'transparent', boxShadow: roleType === 'user' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: roleType === 'user' ? 'bold' : 'normal', color: roleType === 'user' ? '#1f2937' : '#6b7280' }}
          >
            <UserCircle size={18} /> University User
          </button>
          <button 
            type="button"
            onClick={() => { setRoleType('admin'); setError(''); }}
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: roleType === 'admin' ? '#fff' : 'transparent', boxShadow: roleType === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: roleType === 'admin' ? 'bold' : 'normal', color: roleType === 'admin' ? '#1f2937' : '#6b7280' }}
          >
            <ShieldCheck size={18} /> Master Admin
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>
              {roleType === 'admin' ? <Mail size={14} /> : <User size={14} />} 
              {roleType === 'admin' ? ' Email Address' : ' Username'}
            </label>
            <input 
              type={roleType === 'admin' ? 'email' : 'text'} 
              placeholder={roleType === 'admin' ? "Enter your email" : "Enter your username"} 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label><Lock size={14} /> Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="forgot-password-link">
              <span onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? Contact your administrator.</p>
          <button className="btn-text" onClick={() => navigate('/')}>
            Change University
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
