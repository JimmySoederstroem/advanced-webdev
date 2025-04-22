// src/components/ViewExpensesPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import ExpenseList from './ExpenseList'; // Import the component we want to wrap

function ViewExpensesPage() {
  const { authToken } = useContext(AuthContext);
  const [userSettings, setUserSettings] = useState({ currencyCode: 'USD' }); // Default currency
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState('');

  // Fetch user settings when the component mounts
  useEffect(() => {
    const fetchSettings = async () => {
        setLoadingSettings(true);
        setError('');
        if (!authToken) {
            setError("Authentication required to load settings.");
            setLoadingSettings(false);
            return;
        }
        try {
            const response = await fetch('/api/settings', {
                 headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            setUserSettings({ currencyCode: data.currency_code || 'USD' });
             console.log("Fetched Settings in ViewExpensesPage:", data);
        } catch (err) {
            console.error("Failed to fetch settings", err);
            setError("Could not load user settings.");
        } finally {
            setLoadingSettings(false);
        }
    };
    fetchSettings();
  }, [authToken]);

  // Optionally add category filters here too if desired for this page
  // const [selectedCategoryId, setSelectedCategoryId] = useState('');
  // const [categories, setCategories] = useState([]);
  // const [loadingCategories, setLoadingCategories] = useState(true);
  // useEffect(() => { fetch categories logic }, [authToken]);

  if (loadingSettings) {
      return <p>Loading settings...</p>;
  }

  return (
    <div>
        {/* You can add filters here later if needed */}
        {error && <p className="error-message">{error}</p>}

        {/* Render ExpenseList, passing the fetched currencyCode */}
        {/* Ensure showTitle is true so it renders its own title */}
        <ExpenseList
            currencyCode={userSettings.currencyCode}
            showTitle={true}
            // Pass other filters like categoryId if you add them above
            // categoryId={selectedCategoryId || null}
        />
    </div>
  );
}

export default ViewExpensesPage;