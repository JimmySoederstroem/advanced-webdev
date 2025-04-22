// src/components/Settings.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App'; // Import AuthContext
import './Settings.css'; // <<<< Import the new CSS file

// List of common currencies (Code: Symbol/Name for display)
// You can expand this list
const commonCurrencies = [
    { code: 'USD', name: 'USD - US Dollar ($)' },
    { code: 'EUR', name: 'EUR - Euro (€)' },
    { code: 'GBP', name: 'GBP - British Pound (£)' },
    { code: 'JPY', name: 'JPY - Japanese Yen (¥)' },
    { code: 'CAD', name: 'CAD - Canadian Dollar ($)' },
    { code: 'AUD', name: 'AUD - Australian Dollar ($)' },
    { code: 'CHF', name: 'CHF - Swiss Franc (Fr)' },
    { code: 'CNY', name: 'CNY - Chinese Yuan (¥)' },
    { code: 'SEK', name: 'SEK - Swedish Krona (kr)' },
    { code: 'INR', name: 'INR - Indian Rupee (₹)' },
    // Add more as needed
];

function Settings() {
    const { authToken } = useContext(AuthContext);
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD'); // Default currency
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch current settings on load using the new combined endpoint
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            setError('');
            setMessage(''); // Clear messages on load
            if (!authToken) return;

            try {
                const response = await fetch('/api/settings', { // Use new endpoint
                     headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();

                // Set state from fetched data
                setMonthlyBudget(data.monthly_limit !== null ? parseFloat(data.monthly_limit).toFixed(2) : ''); // Handle null budget
                setSelectedCurrency(data.currency_code || 'USD'); // Use fetched currency or default

            } catch (err) {
                console.error("Failed to fetch settings", err);
                setError("Could not load current settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [authToken]);

    const handleSaveSettings = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');
        setSaving(true);

        // Validate budget (allow empty/0 for clearing/no budget)
        const budgetValue = monthlyBudget.trim() === '' ? null : parseFloat(monthlyBudget);
        if (monthlyBudget.trim() !== '' && (isNaN(budgetValue) || budgetValue < 0)) {
            setError('Please enter a valid budget amount (0 or positive), or leave blank for no budget.');
            setSaving(false);
            return;
        }

        // Basic validation for currency (should always be selected from dropdown)
        if (!selectedCurrency || selectedCurrency.length !== 3) {
            setError('Please select a valid currency.');
            setSaving(false);
            return;
        }

        try {
            const response = await fetch('/api/settings', { // Use new endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                // Send both budget (can be null) and currency
                body: JSON.stringify({
                    monthly_limit: budgetValue,
                    currency_code: selectedCurrency
                })
            });

             const data = await response.json(); // Always try parsing

            if (!response.ok) {
                 throw new Error(data.message || `Failed to save settings: ${response.status}`);
            }

            setMessage(data.message || 'Settings saved successfully!');
            // Update local state display immediately after save
            setMonthlyBudget(data.settings?.monthly_limit !== null ? parseFloat(data.settings?.monthly_limit).toFixed(2) : '');
            setSelectedCurrency(data.settings?.currency_code || 'USD');

            // Optionally clear message after few seconds
            setTimeout(() => setMessage(''), 3000);

        } catch (err) {
            console.error("Error saving settings:", err);
            setError(`Failed to save settings: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Loading settings...</p>;

    return (
        <div>
            <h2>Settings</h2>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <form onSubmit={handleSaveSettings}>
                {/* Currency Selection */}
                 <div className="form-group">
                    <label htmlFor="currency">Currency:</label>
                    <select
                        id="currency"
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        required
                    >
                        {commonCurrencies.map(currency => (
                            <option key={currency.code} value={currency.code}>
                                {currency.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Monthly Budget */}
                <div className="form-group">
                    <label htmlFor="budget">Monthly Budget:</label>
                    <input
                        type="number"
                        id="budget"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(e.target.value)}
                        step="0.01"
                        min="0" // Allow 0
                        placeholder="Leave blank or 0 for no budget"
                        // Display currency symbol if available (simple example)
                        style={{ paddingLeft: '25px', position: 'relative' }} // Make space for symbol
                    />
                    {/* Basic symbol display (can be improved) */}
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>
                        {commonCurrencies.find(c => c.code === selectedCurrency)?.name.split(' ')[2]?.replace(/[()]/g, '') || '$'}
                    </span>
                </div>

                <button type="submit" disabled={saving || loading}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}

export default Settings;