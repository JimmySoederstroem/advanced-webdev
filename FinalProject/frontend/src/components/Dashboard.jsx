// src/components/Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import ExpenseList from './ExpenseList';
import { Link } from 'react-router-dom';

// Keep or import the same formatter used in ExpenseList
const formatCurrency = (amount, currencyCode = 'USD') => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount); }
    catch (e) { console.warn("Invalid currency code in Dashboard:", currencyCode); return `$${parseFloat(amount).toFixed(2)}`; }
};

function Dashboard() {
  const { authToken } = useContext(AuthContext);
  const [summaryData, setSummaryData] = useState({ totalSpending: 0, budget: null, currencyCode: 'USD' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError('');
      if (!authToken) { setError("Not authenticated"); setLoading(false); return; }
      try {
        const headers = { 'Authorization': `Bearer ${authToken}` };
        // Fetch combined settings
        const settingsResponse = await fetch('/api/settings', { headers });
        if (!settingsResponse.ok) throw new Error(`Settings fetch failed: ${settingsResponse.status}`);
        const settingsData = await settingsResponse.json();
        const currentBudget = settingsData.monthly_limit;
        const currentCurrency = settingsData.currency_code || 'USD';

        // Fetch expenses for the current month
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
        const expensesResponse = await fetch(`/api/expenses?startDate=${firstDayOfMonth}&endDate=${lastDayOfMonth}`, { headers });
        if (!expensesResponse.ok) throw new Error(`Expenses fetch failed: ${expensesResponse.status}`);
        const expenses = await expensesResponse.json();
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        // Update state with all fetched data
        setSummaryData({ totalSpending: total, budget: currentBudget, currencyCode: currentCurrency });
        console.log("Fetched Settings in Dashboard:", settingsData); // Log to verify

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not load dashboard data. " + err.message);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [authToken]);


  if (loading) return <p>Loading dashboard...</p>;

  // Calculations for Budget Display
  const budget = summaryData.budget !== null ? parseFloat(summaryData.budget) : null;
  const totalSpending = parseFloat(summaryData.totalSpending);
  const budgetLeft = (budget !== null) ? budget - totalSpending : null;
  const budgetProgress = (budget && budget > 0) ? (totalSpending / budget) * 100 : 0;

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <p className="error-message">{error}</p>}

      {/* Summary Section */}
      <div className="dashboard-summary">
        {/* Spending Card */}
        <div className="summary-card">
            <h4>Spending (This Month)</h4>
            {/* Use formatter with state currency */}
            <p>{formatCurrency(totalSpending, summaryData.currencyCode)}</p>
        </div>

        {/* Budget Card */}
        <div className="summary-card">
            <h4>Monthly Budget</h4>
            {budget !== null ? (
                <>
                    <p>{formatCurrency(budget, summaryData.currencyCode)}</p>
                    <p style={{ fontSize: '1rem', fontWeight: '500', color: budgetLeft < 0 ? '#dc3545' : '#28a745', marginBottom: '15px' }}>
                        {formatCurrency(budgetLeft, summaryData.currencyCode)} Left
                    </p>
                    <div className="budget-progress">
                        <div className="progress-bar-container">
                             <div className="progress-bar-fill"
                                  style={{
                                     width: `${Math.min(budgetProgress, 100)}%`,
                                     backgroundColor: budgetProgress > 100 ? '#dc3545' : (budgetProgress > 80 ? '#ffc107' : '#28a745'),
                                  }}>
                             </div>
                        </div>
                        <span>{budgetProgress.toFixed(1)}% Used</span>
                    </div>
                     {budgetProgress > 100 && <p className="warning-text budget-exceeded">Budget Exceeded!</p>}
                     {budgetProgress > 80 && budgetProgress <= 100 && <p className="warning-text budget-warning">Approaching Limit!</p>}
                </>
            ) : (
               <p className="no-budget-text">No budget set. <Link to="/settings">Set Budget</Link></p>
            )}
        </div>
      </div>

      {/* Recent Expenses Section */}
      <div className="recent-expenses">
        <h3>Recent Expenses</h3>
        {/* Pass currencyCode down to ExpenseList */}
        <ExpenseList
            limit={5}
            showTitle={false}
            currencyCode={summaryData.currencyCode} // Pass the code here
        />
      </div>
    </div>
  );
}
export default Dashboard;