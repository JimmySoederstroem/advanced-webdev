// src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');

    // --- Validations ---
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters long.'); return; }
    if (!agreedToTerms) { setError('You must accept the terms and conditions.'); return; }

    setLoading(true);
    try {
        // --- Corrected fetch call ---
        const response = await fetch('/api/register', {
            method: 'POST', // <<< Specify POST method
            headers: {
                'Content-Type': 'application/json', // <<< Specify content type
            },
            body: JSON.stringify({ name, email, password }) // <<< Body with data
        });

        // --- Handle Response (keep error handling from previous fixes) ---
        if (!response.ok) {
            let errorMsg = `Registration failed with status: ${response.status}`;
            let errorBody = '';
            try {
                errorBody = await response.text();
                try {
                     const errData = JSON.parse(errorBody);
                     if (errData && errData.message) { errorMsg = errData.message; }
                     else { errorMsg += ` - ${errorBody.substring(0, 100)}`; }
                } catch (parseError) { errorMsg += ` - ${errorBody.substring(0, 100)}`; }
            } catch (readError) { errorMsg += " (Could not read response body)"; }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        setMessage(data.message || 'Registration successful! Redirecting to login...');
        // Clear form
        setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setAgreedToTerms(false);
        // Redirect after delay
        setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
        console.error("Registration failed:", err); // Log detailed error
        setError(err.message); // Show error to user
    } finally {
        setLoading(false);
    }
  };

  // --- Render the form ---
  return (
    <div className="register-container">
      <h2>Registration</h2>
      {/* Apply centering class to form */}
      <form onSubmit={handleSubmit} className="centered-form">
         <div className="form-group"> <input type="email" id="reg-email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete='email' /> </div>
         <div className="form-group"> <input type="text" id="reg-name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete='name' /> </div>
         <div className="form-group"> <input type="password" id="reg-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete='new-password' /> </div>
         <div className="form-group"> <input type="password" id="reg-confirm-password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete='new-password' /> </div>
         {/* Terms and Conditions Checkbox with Link */}
         <div className="form-group terms-group">
             <input type="checkbox" id="reg-terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} required />
             <label htmlFor="reg-terms">
               I accept the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>
             </label>
         </div>
         {error && <p className="error-message">{error}</p>}
         {message && <p className="success-message">{message}</p>}
         <button className="submit-button" type="submit" disabled={loading}> {loading ? 'Registering...' : 'Register'} </button>
         <p className="login-link"> Already have an account? <Link to="/login">Login</Link> </p>
      </form>
    </div>
  );
}
export default Register;