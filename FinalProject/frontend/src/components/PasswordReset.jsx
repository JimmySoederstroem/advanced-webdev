// src/components/PasswordReset.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(''); setError(''); setLoading(true);

    if (!email || !newPassword) {
      setError('Please enter both email and new password.');
      setLoading(false);
      return;
    }
     if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        setLoading(false);
        return;
     }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }
      setMessage(data.message || 'Password reset successful!');
      setError(''); // Clear error on success
      // Optional: Redirect to login after delay
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      console.error("Password reset failed:", err);
      setError(err.message);
      setMessage(''); // Clear success message on error
    } finally {
      setLoading(false);
    }
  };

  return (
    // Reuse login/register container styles
    <div className="login-container">
      <h2>Reset Password</h2>
      <p style={{textAlign: 'center', color: '#6c757d', marginBottom: '20px'}}>Enter your email and new desired password.</p>
      {/* Apply centering class */}
      <form onSubmit={handleSubmit} className="centered-form">
        <div className="form-group">
          <input type="email" id="reset-email" placeholder="Your Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="form-group">
          <input type="password" id="reset-password" placeholder="New Password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password"/>
        </div>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <button className="submit-button" type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <p className="login-link">
            Remembered your password? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default PasswordReset;