// src/components/Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import ExpenseList from './ExpenseList';
import { Link } from 'react-router-dom';

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
  // State for budget alerts
  const [budgetAlert, setBudgetAlert] = useState({ message: '', type: '' }); // type can be 'warning' or 'exceeded'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError('');
      if (!authToken) { setError("Not authenticated"); setLoading(false); return; }
      try {
        const headers = { 'Authorization': `Bearer ${authToken}` };
        const settingsResponse = await fetch('/api/settings', { headers });
        if (!settingsResponse.ok) throw new Error(`Settings fetch failed: ${settingsResponse.status}`);
        const settingsData = await settingsResponse.json();
        const currentBudget = settingsData.monthly_limit;
        const currentCurrency = settingsData.currency_code || 'USD';

        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
        const expensesResponse = await fetch(`/api/expenses?startDate=${firstDayOfMonth}&endDate=${lastDayOfMonth}`, { headers });
        if (!expensesResponse.ok) throw new Error(`Expenses fetch failed: ${expensesResponse.status}`);
        const expenses = await expensesResponse.json();
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        setSummaryData({ totalSpending: total, budget: currentBudget, currencyCode: currentCurrency });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not load dashboard data. " + err.message);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [authToken]);

  // Calculations for Budget Display & Alerts
  const budget = summaryData.budget !== null ? parseFloat(summaryData.budget) : null;
  const totalSpending = parseFloat(summaryData.totalSpending);
  const budgetLeft = (budget !== null) ? budget - totalSpending : null;
  const budgetProgress = (budget && budget > 0) ? (totalSpending / budget) * 100 : 0;

  // useEffect to check budget status and set alerts
  useEffect(() => {
    if (budget !== null && !isNaN(totalSpending)) {
        const percentageUsed = (totalSpending / budget) * 100;
        if (budget === 0) { // If budget is explicitly set to 0, don't show alerts based on percentage
          setBudgetAlert({ message: '', type: '' });
        } else if (percentageUsed >= 100) {
            setBudgetAlert({
                message: `Budget Exceeded! You've spent ${formatCurrency(totalSpending, summaryData.currencyCode)} of your ${formatCurrency(budget, summaryData.currencyCode)} budget.`,
                type: 'exceeded'
            });
        } else if (percentageUsed >= 80) {
            setBudgetAlert({
                message: `Warning: You've spent ${formatCurrency(totalSpending, summaryData.currencyCode)} (${percentageUsed.toFixed(1)}%) of your ${formatCurrency(budget, summaryData.currencyCode)} budget.`,
                type: 'warning'
            });
        } else {
            setBudgetAlert({ message: '', type: '' }); // Clear alert if below threshold
        }
    } else {
        setBudgetAlert({ message: '', type: '' }); // No budget set or spending not loaded
    }
  }, [totalSpending, budget, summaryData.currencyCode]); // Re-run when these change

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <p className="error-message">{error}</p>}

      {/* Display Budget Alert */}
      {budgetAlert.message && (
        <div className={`budget-alert ${budgetAlert.type === 'warning' ? 'alert-warning' : 'alert-exceeded'}`}>
          {budgetAlert.message}
        </div>
      )}

      {/* Summary Section */}
      <div className="dashboard-summary">
        <div className="summary-card">
            <h4>Spending (This Month)</h4>
            <p>{formatCurrency(totalSpending, summaryData.currencyCode)}</p>
        </div>
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
                     {/* These can be removed if the top alert is preferred */}
                     {/* {budgetProgress > 100 && <p className="warning-text budget-exceeded">Budget Exceeded!</p>} */}
                     {/* {budgetProgress > 80 && budgetProgress <= 100 && <p className="warning-text budget-warning">Approaching Limit!</p>} */}
                </>
            ) : (
               <p className="no-budget-text">No budget set. <Link to="/settings">Set Budget</Link></p>
            )}
        </div>
      </div>

      <div className="recent-expenses">
        <h3>Recent Expenses</h3>
        <ExpenseList limit={5} showTitle={false} currencyCode={summaryData.currencyCode} />
      </div>
    </div>
  );
}
export default Dashboard;
