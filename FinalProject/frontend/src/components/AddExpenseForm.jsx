// src/components/AddExpenseForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App'; // Import AuthContext
import { useNavigate } from 'react-router-dom';

function AddExpenseForm() {
  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState([]); // State to hold categories
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true); // Loading state for categories
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for form submission

  // --- Fetch categories when the component mounts ---
  useEffect(() => {
    const fetchCategories = async () => {
        setLoadingCategories(true); // Start loading
        setError(''); // Clear previous errors
        if (!authToken) {
            setError("Authentication error. Cannot load categories.");
            setLoadingCategories(false);
            return;
        }

        try {
            // Fetch from the backend endpoint
            const response = await fetch('/api/categories', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch categories: ${response.status}`);
            }
            const data = await response.json();
            setCategories(data); // Store fetched categories in state
            // Optionally set a default category if desired (e.g., the first one)
            // if (data.length > 0) {
            //     setCategoryId(data[0].id.toString());
            // }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            setError("Could not load categories. Please ensure the backend is running and reachable.");
        } finally {
            setLoadingCategories(false); // Finish loading
        }
    };
    fetchCategories();
  }, [authToken]); // Re-run if authToken changes

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!amount || !categoryId || !date) {
        setError('Please fill in amount, category, and date.');
        return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid positive amount.');
        return;
    }
    if (categoryId === "") {
        setError('Please select a category.');
        return;
    }


    const newExpense = {
        amount: parsedAmount,
        category_id: parseInt(categoryId, 10),
        date,
        notes
    };

    setIsSubmitting(true); // Indicate submission is in progress

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(newExpense)
        });

        if (!response.ok) {
            let errorMsg = `Error adding expense: ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.message || errorMsg;
            } catch (e) { /* Ignore if response isn't JSON */ }
            throw new Error(errorMsg);
        }

        const addedExpense = await response.json();
        console.log('Expense added:', addedExpense);
        setMessage('Expense added successfully!');
        setAmount('');
        setCategoryId(''); // Reset category selection
        setDate(new Date().toISOString().slice(0, 10));
        setNotes('');
        // Optionally clear message after delay
        setTimeout(() => setMessage(''), 3000);
        // Optional: Navigate after success
        // setTimeout(() => navigate('/list'), 1500);

    } catch (err) {
        console.error('Error adding expense:', err);
        setError(`Failed to add expense: ${err.message}`);
    } finally {
        setIsSubmitting(false); // Finish submission attempt
    }
  };

  return (
    <div>
      {/* Use the title from the mockup [cite: 5] */}
      <h2>Add expense</h2>
      <form onSubmit={handleSubmit}>
        {/* Use structure and labels/placeholders based on mockup [cite: 5] */}
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
          />
        </div>
        <div className="form-group">
           <label htmlFor="date">Date:</label>
           <input
             type="date"
             id="date"
             value={date}
             onChange={(e) => setDate(e.target.value)}
             required
           />
         </div>
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          {/* Category Dropdown */}
          <select
             id="category"
             value={categoryId}
             onChange={(e) => setCategoryId(e.target.value)}
             required
             disabled={loadingCategories || categories.length === 0} // Disable while loading or if empty
          >
             {/* Default prompt option */}
             <option value="" disabled={categoryId !== ""} >
                {loadingCategories ? "Loading categories..." : "-- Select a Category --"}
             </option>
             {/* Map over fetched categories */}
             {!loadingCategories && categories.map(cat => (
                 <option key={cat.id} value={cat.id}>{cat.name}</option>
             ))}
          </select>
          {/* Show message if no categories are loaded */}
          {!loadingCategories && categories.length === 0 && error === '' && (
            <p style={{color: 'grey', fontSize: '0.9em', marginTop: '5px'}}>No categories found. Categories might need to be added via backend/database.</p>
          )}
        </div>
         <div className="form-group">
           <label htmlFor="notes">Description (Optional):</label>
           <textarea
             id="notes"
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             placeholder="Optional details about the expense"
           />
         </div>

        {/* Display error and success messages */}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {/* Use button text from mockup [cite: 5] */}
        <button type="submit" disabled={isSubmitting || loadingCategories}>
            {isSubmitting ? 'Adding...' : 'Add expense'}
        </button>
      </form>
    </div>
  );
}

export default AddExpenseForm;
