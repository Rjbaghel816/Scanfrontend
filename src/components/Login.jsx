import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

const Login = () => {
  const { tenantId, user, login, clearTenant } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // If we already have a user, this component shouldn't ideally be rendered,
  // but just in case, we return null so it doesn't show.
  if (user) return null;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
           <button className="back-btn" onClick={clearTenant}>&larr; Back to Universities</button>
           <h2>Login to {tenantId.toUpperCase()}</h2>
        </div>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin} className="login-form">
           <input 
             type="email" 
             placeholder="Admin Email" 
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
             {loading ? 'Logging in...' : 'Login'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
