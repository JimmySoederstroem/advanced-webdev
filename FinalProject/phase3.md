I found that I had some issues with the alerts when 80" and 100% of the budget is used so I corrected that.
so the target is the following use case: **4. User Sets a Budget and Gets Alerts (Budgeting Feature)**
Actors: User, System

Preconditions: User must be logged in and have recorded expenses.

Flow of Events:

User navigates to "Settings" and sets a monthly budget.

System stores the budget limit and tracks spending against it.

When expenses reach 80% of the budget, the system sends a warning.

If expenses exceed 100%, the system sends an alert.

Outcome: User is notified when approaching or exceeding budget limits.
Changes made to dashboard.jsx and app.css
1. New State for Budget Alert
Add this state variable near your other useState hooks:

  // State for budget alerts
  const [budgetAlert, setBudgetAlert] = useState({ message: '', type: '' }); // type can be 'warning' or 'exceeded'

2. New useEffect Hook for Setting Budget Alerts
This effect runs when totalSpending, budget, or summaryData.currencyCode changes. Add this alongside your existing useEffect for fetching data:

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


3. JSX for Displaying the Budget Alert
Add this block within the return (...) statement, typically right after the <h2>Dashboard</h2> and any general error message display:

      {/* Display Budget Alert */}
      {budgetAlert.message && (
        <div className={`budget-alert ${budgetAlert.type === 'warning' ? 'alert-warning' : 'alert-exceeded'}`}>
          {budgetAlert.message}
        </div>
      )}

4. Removal of Old Warning Texts in Budget Card
If you had smaller warning texts directly under the progress bar, you might have commented them out or removed them, as the new alert at the top is more prominent. For example:

            {/* These can be removed if the top alert is preferred */}
            {/* {budgetProgress > 100 && <p className="warning-text budget-exceeded">Budget Exceeded!</p>} */}
            {/* {budgetProgress > 80 && budgetProgress <= 100 && <p className="warning-text budget-warning">Approaching Limit!</p>} */}

Code for src/App.css
Add these new CSS rules. You can place them near other message styling like .error-message.

1. New Styles for Budget Alerts
/* --- Budget Alert Styles --- */
.budget-alert {
    padding: 15px 20px;
    margin-bottom: 25px; /* Space below the alert */
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 0.95rem;
    text-align: center;
}

.budget-alert.alert-warning {
    color: #856404; /* Dark yellow/brown text */
    background-color: #fff3cd; /* Light yellow background */
    border-color: #ffeeba; /* Lighter yellow border */
}

.budget-alert.alert-exceeded {
    color: #721c24; /* Dark red text */
    background-color: #f8d7da; /* Light red background */
    border-color: #f5c6cb; /* Lighter red border */
}

2. Updated/Enhanced Styles for Dashboard Summary Cards
These are the styles that give the "boxes" a more defined look. Ensure these replace or update any existing styles for .dashboard-summary and .summary-card.

/* Styles for Dashboard Summary Section */
.dashboard-summary {
    display: grid;
    /* Creates responsive columns: min width 250px, max 1fr */
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px; /* Increased gap */
    margin-bottom: 40px;
}

.summary-card {
    background-color: #ffffff; /* Ensure white background stands out */
    padding: 25px; /* Slightly more padding */
    border-radius: 8px;
    border: 1px solid #e9ecef; /* Lighter border */
    /* Enhanced shadow for more definition */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s ease; /* Add hover effect */
}

.summary-card:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08); /* Slightly lift on hover */
}

.summary-card h4 {
    margin-top: 0;
    margin-bottom: 12px; /* More space below heading */
    font-size: 0.95rem; /* Slightly smaller heading */
    color: #6c757d; /* Grey heading color */
    font-weight: 500;
    text-transform: uppercase; /* Uppercase heading */
    letter-spacing: 0.5px; /* Add letter spacing */
}

.summary-card p {
    font-size: 1.8rem; /* Larger main value */
    font-weight: 600;
    color: #343a40;
    margin-bottom: 10px;
    line-height: 1.2; /* Adjust line height */
}

/* Styles for budget progress bar (ensure these are present) */
.budget-progress { margin-top: 15px; }
.progress-bar-container { background-color: #e9ecef; border-radius: 5px; height: 8px; width: 100%; overflow: hidden; margin-bottom: 5px; }
.progress-bar-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease-in-out, background-color 0.5s ease-in-out; }
.budget-progress span { font-size: 0.8em; color: #6c757d; display: block; text-align: right; }
.warning-text { font-size: 0.85em; font-weight: bold; margin-top: 8px; text-align: center; }
.budget-warning { color: #ffc107; }
.budget-exceeded { color: #dc3545; }
.no-budget-text { font-size: 0.9em !important; font-style: italic; color: #6c757d !important; margin-top: 15px; }
.no-budget-text a { color: #007bff; text-decoration: none;}
.no-budget-text a:hover { text-decoration: underline;}
