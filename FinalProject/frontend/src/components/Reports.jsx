// src/components/Reports.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../App';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ExpenseList from './ExpenseList'; // Import ExpenseList component

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6666', '#66CCCC', '#FFCC66'];
const getStartDateForPeriod = (period) => {
    const now = new Date(); let startDate = new Date();
    switch (period) {
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case '3months': startDate.setMonth(now.getMonth() - 3); break;
        case '6months': startDate.setMonth(now.getMonth() - 6); break;
        default: startDate = null;
    } return startDate ? startDate.toISOString().slice(0, 10) : null;
};

// Keep or import the same formatter
const formatCurrency = (amount, currencyCode = 'USD') => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 'N/A';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericAmount); }
    catch (e) { console.warn("Invalid currency code in Reports:", currencyCode); return numericAmount.toFixed(2); }
};

function Reports() {
  const { authToken } = useContext(AuthContext);
  // Chart state
  const [reportData, setReportData] = useState({ week: [], month: [], months3: [], months6: [] });
  const [loadingCharts, setLoadingCharts] = useState({ week: true, month: true, months3: true, months6: true });
  // List filter state
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  // Settings state
  const [userSettings, setUserSettings] = useState({ currencyCode: 'USD', budget: null });
  const [loadingSettings, setLoadingSettings] = useState(true);
  // General error state
  const [error, setError] = useState('');

  // --- Fetch categories ---
  useEffect(() => {
    const fetchCategories = async () => {
        setLoadingCategories(true); if (!authToken) return;
        try {
            const response = await fetch('/api/categories', { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json(); setCategories(data);
        } catch (err) { console.error("Failed to fetch categories for filter:", err); setError(prev => `${prev} Failed to load categories.`); }
        finally { setLoadingCategories(false); }
    };
    fetchCategories();
  }, [authToken]);

  // --- Fetch user settings ---
   useEffect(() => {
    const fetchSettings = async () => {
        setLoadingSettings(true); if (!authToken) return;
        try {
            const response = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json(); setUserSettings({ currencyCode: data.currency_code || 'USD', budget: data.monthly_limit });
            console.log("Fetched Settings in Reports:", data);
        } catch (err) { console.error("Failed to fetch settings for reports", err); setError(prev => `${prev} Failed to load settings.`); }
        finally { setLoadingSettings(false); }
    };
    fetchSettings();
  }, [authToken]);

  // --- Fetch chart data ---
  const fetchChartDataForPeriod = useCallback(async (periodKey, startDate, endDate = null) => {
    setLoadingCharts(prev => ({ ...prev, [periodKey]: true })); if (!authToken) { /*...*/ setLoadingCharts(prev => ({ ...prev, [periodKey]: false })); return; }
    const queryParams = new URLSearchParams(); if (startDate) queryParams.append('startDate', startDate); if (endDate) queryParams.append('endDate', endDate); const queryString = queryParams.toString();
    try {
        const response = await fetch(`/api/reports${queryString ? `?${queryString}` : ''}`, { headers: { 'Authorization': `Bearer ${authToken}` } }); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json(); const formattedData = data.map(item => ({ ...item, total_amount: parseFloat(item.total_amount) || 0 }));
        setReportData(prev => ({ ...prev, [periodKey]: formattedData }));
    } catch (err) { console.error(`Failed chart fetch ${periodKey}:`, err); setError(prev => `${prev} Failed chart load ${periodKey}. `); }
    finally { setLoadingCharts(prev => ({ ...prev, [periodKey]: false })); }
  }, [authToken]);

  // Fetch chart data on mount
  useEffect(() => {
    setError(''); const today = new Date().toISOString().slice(0, 10);
    fetchChartDataForPeriod('week', getStartDateForPeriod('week'), today); fetchChartDataForPeriod('month', getStartDateForPeriod('month'), today);
    fetchChartDataForPeriod('months3', getStartDateForPeriod('3months'), today); fetchChartDataForPeriod('months6', getStartDateForPeriod('6months'), today);
  }, [fetchChartDataForPeriod]);

   // --- Export Function ---
   const handleExport = async (format = 'csv') => {
        setError(''); if (!authToken) { setError("Authentication required."); return; }
        // Add filter parameters to export
        const queryParams = new URLSearchParams({ format });
        // Optionally add date filters here if UI elements are added
        if (selectedCategoryId) queryParams.append('categoryId', selectedCategoryId);
        const queryString = queryParams.toString(); const apiUrl = `/api/export?${queryString}`;
        try {
            console.log(`Requesting export from: ${apiUrl}`);
            const response = await fetch(apiUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) { /* ... error handling ... */ throw new Error(/* ... */); }
            // Handle File Download
            const disposition = response.headers.get('content-disposition'); let filename = `expenses_${Date.now()}.${format}`;
            if (disposition && disposition.includes('attachment')) { /* ... extract filename ... */ }
            const blob = await response.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
        } catch (err) { console.error('Error exporting data:', err); setError(`Export failed: ${err.message}`); }
   };

   // --- Reusable Pie Chart Component ---
   const renderPieChart = (data, title, isLoading) => {
       const chartData = data.map(d => ({ name: d.category_name, value: d.total_amount }));
       const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
       if (isLoading || loadingSettings) { return <div className="chart-container loading">Loading {title}...</div>; }
       if (chartData.length === 0) { return <div className="chart-container empty">No spending data for {title}.</div>; }
       return (
           <div className="chart-container">
               <h3>{title} (Total: {formatCurrency(total, userSettings.currencyCode)})</h3> {/* Use fetched currency */}
               <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                       <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                           {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                       </Pie>
                       <Tooltip formatter={(value, name) => [formatCurrency(value, userSettings.currencyCode), name]} /> {/* Use fetched currency */}
                       <Legend />
                   </PieChart>
               </ResponsiveContainer>
           </div>
       );
   };

  // --- Component Render ---
  return (
    <div>
      <h2>Reports</h2>
      {error && <p className="error-message">{error}</p>}

      {/* Charts Section */}
      <div className="charts-grid">
          {renderPieChart(reportData.week, 'Last 7 Days', loadingCharts.week)}
          {renderPieChart(reportData.month, 'Last Month', loadingCharts.month)}
          {renderPieChart(reportData.months3, 'Last 3 Months', loadingCharts.months3)}
          {renderPieChart(reportData.months6, 'Last 6 Months', loadingCharts.months6)}
      </div>

      {/* Expenses List Section */}
      <div className="expenses-list-section">
          <h3>All Expenses</h3>
          <div className="filter-container form-group">
              <label htmlFor="categoryFilter">Filter by Category:</label>
              <select id="categoryFilter" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} disabled={loadingCategories}>
                  <option value="">All Categories</option>
                  {loadingCategories ? (<option disabled>Loading...</option>) : ( categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>)) )}
              </select>
          </div>
          {/* Render ExpenseList, passing currencyCode */}
          <ExpenseList
              categoryId={selectedCategoryId || null}
              showTitle={false}
              currencyCode={userSettings.currencyCode} // Pass the code here
          />
      </div>

       {/* Export Buttons Section */}
       <div className="export-section">
            <button onClick={() => handleExport('csv')}>Export as CSV</button>
            <button onClick={() => handleExport('pdf')} style={{marginLeft: '10px'}}>Export as PDF</button>
       </div>
    </div>
  );
}
export default Reports;