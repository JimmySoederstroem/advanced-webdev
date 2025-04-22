// src/App.jsx
import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';

// Import new wrapper component
import ViewExpensesPage from './components/ViewExpensesPage'; // <<< Import ViewExpensesPage

// Import other components (keep existing imports)
import TermsAndConditions from './components/TermsAndConditions';
import PasswordReset from './components/PasswordReset';
import Dashboard from './components/Dashboard';
import AddExpenseForm from './components/AddExpenseForm';
// import ExpenseList from './components/ExpenseList'; // Can remove this direct import if only used via wrappers
import Reports from './components/Reports';
import Login from './components/Login';
import Register from './components/Register';
import Settings from './components/Settings';
import './App.css';

export const AuthContext = createContext(null);

function App() {
  // ... (keep existing state and functions: authToken, isLoading, handleLogin, handleLogout) ...
   const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
   const [isLoading, setIsLoading] = useState(true);
   useEffect(() => { setIsLoading(false); }, [authToken]);
   const handleLogin = (token) => { localStorage.setItem('authToken', token); setAuthToken(token); };
   const handleLogout = () => { localStorage.removeItem('authToken'); setAuthToken(null); };
   if (isLoading) { return <div>Loading application...</div>; }


  // Routes available when NOT authenticated
  const PublicRoutes = () => (
       <Routes>
           {/* ... keep /login, /register, /terms, /reset-password routes ... */}
           <Route path="/login" element={<Login onLogin={handleLogin} />} />
           <Route path="/register" element={<Register />} />
           <Route path="/terms" element={<TermsAndConditions />} />
           <Route path="/reset-password" element={<PasswordReset />} />
           <Route path="*" element={<Navigate to="/login" />} />
       </Routes>
  );

  // Routes available ONLY when authenticated (within sidebar layout)
  const ProtectedRoutes = () => (
      <div className="app-layout">
          <nav className="sidebar-nav">
              {/* ... sidebar content ... */}
               <div className="sidebar-header"><h3>Expenser</h3></div>
               <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
               <NavLink to="/add" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Add Expense</NavLink>
               {/* Changed path highlight slightly */}
               <NavLink to="/list" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>View Expenses</NavLink>
               <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Reports</NavLink>
               <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Settings</NavLink>
               <button onClick={handleLogout} className="logout-button">Logout</button>
          </nav>
          <main className="main-content">
              <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/add" element={<AddExpenseForm />} />
                  {/* Use the new wrapper component for the /list route */}
                  <Route path="/list" element={<ViewExpensesPage />} /> {/* <<< UPDATED ROUTE */}
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="*" element={<Navigate to="/" />} />
              </Routes>
          </main>
      </div>
  );

  return (
      <AuthContext.Provider value={{ authToken, handleLogout }}>
          <Router>
              {authToken ? <ProtectedRoutes /> : <PublicRoutes />}
          </Router>
      </AuthContext.Provider>
  );
}
export default App;