// src/components/Login.jsx
import React, { useState, useContext } from 'react'; // Import useContext
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App'; // Assuming AuthContext provides onLogin

// Note: onLogin should be passed via props or context
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Remember me state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Get onLogin from context if not passed via props (alternative)
  // const auth = useContext(AuthContext);
  // const handleLoginSubmit = auth?.onLogin || onLogin;

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || `Login failed: ${response.status}`); }
      if (data.accessToken) {
          if(onLogin) { // Check if onLogin function is passed
            onLogin(data.accessToken); // Call the function passed from App
            // Handle remember me logic here later (e.g., local storage)
            navigate('/'); // Redirect to dashboard
          } else {
            console.error("onLogin prop not passed to Login component!");
            setError("Login callback function missing.");
          }
      } else { throw new Error("Login successful but no token received."); }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {/* Apply centering class */}
      <form onSubmit={handleSubmit} className="centered-form">
        <div className="form-group">
          <input type="email" id="login-email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete='email' />
        </div>
        <div className="form-group">
          <input type="password" id="login-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete='current-password' />
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="form-group form-links-row">
             <div className="remember-me">
                 <input type="checkbox" id="login-remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                 <label htmlFor="login-remember">Remember me</label>
             </div>
             <Link to="/reset-password">Forgot your password?</Link>
        </div>

        {error && <p className="error-message">{error}</p>}
        <button className="submit-button" type="submit" disabled={loading}> {loading ? 'Logging in...' : 'Login'} </button>

        {/* Link to Register Page */}
        <p className="register-link">
            Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
export default Login;