// src/components/ExpenseList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App'; // Import AuthContext

// Helper to format currency based on code passed as prop
const formatCurrency = (amount, currencyCode = 'USD') => { // Default to USD if code not provided
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        return 'N/A'; // Or return the original value, or '0.00'
    }
    try {
        return new Intl.NumberFormat(undefined, { // Use browser locale preference for number format
            style: 'currency',
            currency: currencyCode, // Use the code passed via props
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericAmount);
    } catch (e) {
        // Fallback if currency code is invalid
        console.warn("Invalid currency code in formatCurrency:", currencyCode);
        // Default formatting with '$' might be confusing, maybe just number?
        // return `$${numericAmount.toFixed(2)}`;
        return numericAmount.toFixed(2); // Fallback to just number
    }
};

// Helper to format date safely
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // Try creating date directly - handles ISO strings YYYY-MM-DDTHH:mm:ss.sssZ well
    // Also often handles YYYY-MM-DD correctly, assuming UTC if no time specified
    const date = new Date(dateString);
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) {
        // Optional: Try parsing specifically as YYYY-MM-DD if first attempt failed
        // Assumes UTC to avoid timezone shifts converting YYYY-MM-DD
        const parts = dateString.split('-');
        if (parts.length === 3) {
           const utcDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
           if (!isNaN(utcDate.getTime())) {
              // Return in YYYY-MM-DD format consistently or use locale string
              // return utcDate.toISOString().slice(0, 10);
              return utcDate.toLocaleDateString(undefined, { timeZone: 'UTC' }); // Display in UTC
           }
        }
       throw new Error('Could not parse date'); // Throw if still invalid
    }
    // Use browser's default locale for formatting the valid date
    return date.toLocaleDateString();
  } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date"; // Graceful fallback
  }
};


// Accept currencyCode prop
function ExpenseList({ limit, categoryId, startDate, endDate, showTitle = true, currencyCode }) {
  const { authToken } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
        setLoading(true);
        setError(null);
        if (!authToken) { setLoading(false); return; }

        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit);
        if (categoryId) queryParams.append('categoryId', categoryId);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        const queryString = queryParams.toString();
        const apiUrl = `/api/expenses${queryString ? `?${queryString}` : ''}`;

        try {
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch(e) {}
                throw new Error(errorMsg);
            }
            const data = await response.json(); setExpenses(data);
        } catch (err) {
            console.error("Failed to fetch expenses:", err); setError("Could not load expenses. " + err.message);
        } finally { setLoading(false); }
    };
    fetchExpenses();
  }, [authToken, limit, categoryId, startDate, endDate]);

  const handleDelete = async (expenseId) => {
      if (!window.confirm("Are you sure you want to delete this expense?")) { return; }
      setError('');
      try {
          const response = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
          if (!response.ok) {
              let errorMsg = `Delete failed: ${response.status}`;
              try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch(e) {}
              throw new Error(errorMsg);
          }
          setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== expenseId));
          // alert("Expense deleted successfully."); // Optional success message
      } catch (err) {
          console.error("Failed to delete expense:", err);
          setError("Could not delete expense. " + err.message);
          alert("Error deleting expense: " + err.message); // Show error
      }
  };

  return (
    <>
      {showTitle && <h2>Expense List</h2>}
      {loading && <p>Loading expenses...</p>}
      {error && <p className="error-message" style={{marginTop: 0}}>{error}</p>}
      {!loading && expenses.length === 0 && !error && ( <p>No expenses found for the selected criteria.</p> )}
      {!loading && expenses.length > 0 && (
        <div className="table-container">
            <table>
            <thead>
                <tr><th>Date</th><th>Category</th><th>Amount</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
                {expenses.map(expense => (
                <tr key={expense.id}>
                    <td>{formatDate(expense.date)}</td> {/* Use safe date formatter */}
                    <td>{expense.category_name || `ID: ${expense.category_id}`}</td>
                    <td>{formatCurrency(expense.amount, currencyCode)}</td> {/* Use currency formatter */}
                    <td>{expense.notes}</td>
                    <td><button onClick={() => handleDelete(expense.id)} className="delete-button">Delete</button></td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </>
  );
}

export default ExpenseList;