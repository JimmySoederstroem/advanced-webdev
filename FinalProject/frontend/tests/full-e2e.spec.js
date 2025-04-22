// tests/full-e2e.spec.js
import { test, expect } from '@playwright/test';
// --- Test Configuration & Data ---
// Ensures a unique email for each test run
const uniqueEmail = `testuser-${Date.now()}@example.com`;
const testPassword = 'password123'; // Use a consistent test password
const testName = 'E2E Tester';
const testBudget = '750.50';
const testCurrencyCode = 'EUR'; // Must match an option value
const testCurrencyName = 'EUR - Euro (€)'; // Text displayed in dropdown
const testCurrencySymbol = '€'; // Symbol for assertions

const expense1 = { amount: '123.45', category: 'Food', notes: 'Test Expense 1 - Lunch' };
const expense2 = { amount: '67.89', category: 'Transport', notes: 'Test Expense 2 - Bus' };
const totalMonthlySpending = (parseFloat(expense1.amount) + parseFloat(expense2.amount)).toFixed(2);
const budgetLeft = (parseFloat(testBudget) - parseFloat(totalMonthlySpending)).toFixed(2);
const today = new Date().toISOString().slice(0, 10);
const todayFormatted = new Date(today + 'T00:00:00').toLocaleDateString(); // For date comparison

test.describe('Expense Tracker - Full E2E Workflow', () => {

  test('should allow register, login, settings, add expense, view reports, export, logout', async ({ page }) => {

    // --- Step 1: Registration ---
    console.log('TEST: Starting Registration...');
    await page.goto('/register');
    await expect(page.locator('h2:has-text("Registration")')).toBeVisible();

    // Fill registration form
    // **ACTION: Verify these selectors match your Register.jsx component**
    await page.locator('#reg-email').fill(uniqueEmail);
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-password').fill(testPassword);
    await page.locator('#reg-confirm-password').fill(testPassword);
    await page.locator('#reg-terms').check();
    await page.locator('button.submit-button:has-text("Register")').click();

    // Expect redirection to Login page
    await expect(page.locator('h2:has-text("Login")')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL('/login', { timeout: 10000 });
    console.log('TEST: Registration Successful, Redirected to Login.');

    // --- Step 2: Login ---
    console.log('TEST: Starting Login...');
    // Fill login form
    // **ACTION: Verify these selectors match your Login.jsx component**
    await page.locator('#login-email').fill(uniqueEmail);
    await page.locator('#login-password').fill(testPassword);
    await page.locator('button.submit-button:has-text("Login")').click();

    // Expect redirection to Dashboard
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL('/', { timeout: 10000 });
    console.log('TEST: Login Successful, Redirected to Dashboard.');

    // --- Step 3: Set Settings ---
    console.log('TEST: Setting Currency and Budget...');
    // **ACTION: Verify selector for Settings link in sidebar**
    await page.locator('.sidebar-nav a.nav-link:has-text("Settings")').click();
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // **ACTION: Verify selectors for Currency dropdown and Budget input**
    const currencySelectSelector = '#currency';
    const budgetInputSelector = '#budget';
    const saveSettingsButtonSelector = 'button:has-text("Save Changes")';

    // Wait for settings to potentially load existing values
    await page.waitForTimeout(1000); // Simple wait, can be improved

    // Set Currency
    await page.locator(currencySelectSelector).selectOption({ value: testCurrencyCode });
    // Set Budget
    await page.locator(budgetInputSelector).fill(testBudget);
    // Save
    await page.locator(saveSettingsButtonSelector).click();

    // Expect success message
    // **ACTION: Verify selector for success message**
    await expect(page.locator('.success-message')).toContainText('Settings saved successfully!', { timeout: 5000 });
    console.log('TEST: Settings Saved.');
    // Optional: add refresh + verify steps here if needed

    // --- Step 4: Add Expense 1 ---
    console.log('TEST: Adding Expense 1...');
    // **ACTION: Verify selector for Add Expense link in sidebar**
    await page.locator('.sidebar-nav a.nav-link:has-text("Add Expense")').click();
    await expect(page.locator('h2:has-text("Add expense")')).toBeVisible();

    // **ACTION: Verify selectors for Add Expense form**
    const amountInputSelector = '#amount';
    const dateInputSelector = '#date';
    const categorySelectSelector = '#category';
    const notesInputSelector = '#notes';
    const addExpenseButtonSelector = 'button:has-text("Add expense")';

    // Fill form
    await page.locator(amountInputSelector).fill(expense1.amount);
    await page.locator(dateInputSelector).fill(today);
    // Wait for categories dropdown options to be populated
    await page.locator(categorySelectSelector).waitFor({ state: 'visible', timeout: 5000 });
    await expect(page.locator(categorySelectSelector)).not.toBeDisabled();
    await page.locator(categorySelectSelector).selectOption({ label: expense1.category });
    await page.locator(notesInputSelector).fill(expense1.notes);
    await page.locator(addExpenseButtonSelector).click();

    // Expect success message
    await expect(page.locator('.success-message')).toContainText('Expense added successfully', { timeout: 5000 });
    console.log('TEST: Expense 1 Added.');

    // --- Step 5: Add Expense 2 ---
    console.log('TEST: Adding Expense 2...');
    // Form should be clear, just add second expense
    await page.locator(amountInputSelector).fill(expense2.amount);
    await page.locator(dateInputSelector).fill(today); // Use same date for simplicity
    await page.locator(categorySelectSelector).selectOption({ label: expense2.category });
    await page.locator(notesInputSelector).fill(expense2.notes);
    await page.locator(addExpenseButtonSelector).click();

    // Expect success message
    await expect(page.locator('.success-message')).toContainText('Expense added successfully', { timeout: 5000 });
    console.log('TEST: Expense 2 Added.');

    // --- Step 6: Verify Dashboard ---
    console.log('TEST: Verifying Dashboard...');
    // **ACTION: Verify selector for Dashboard link in sidebar**
    await page.locator('.sidebar-nav a.nav-link:has-text("Dashboard")').click();
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });

    // **ACTION: Verify selectors for summary cards**
    const spendingCardSelector = '.summary-card:has(h4:has-text("Spending")) p';
    const budgetCardSelector = '.summary-card:has(h4:has-text("Monthly Budget")) p:first-of-type'; // First p is total budget
    const budgetLeftSelector = '.summary-card:has(h4:has-text("Monthly Budget")) p:nth-of-type(2)'; // Second p is budget left

    // Check spending uses correct currency and amount
    await expect(page.locator(spendingCardSelector)).toContainText(testCurrencySymbol); // Check for symbol (€)
    await expect(page.locator(spendingCardSelector)).toContainText(totalMonthlySpending); // Check for amount

    // Check budget uses correct currency and amount
    await expect(page.locator(budgetCardSelector)).toContainText(testCurrencySymbol);
    await expect(page.locator(budgetCardSelector)).toContainText(parseFloat(testBudget).toFixed(2));

    // Check budget left uses correct currency and amount
    await expect(page.locator(budgetLeftSelector)).toContainText(testCurrencySymbol);
    await expect(page.locator(budgetLeftSelector)).toContainText(parseFloat(budgetLeft).toFixed(2)); // Use parsed float for comparison if needed

    // Check recent expenses list on dashboard (assuming limit=5 includes these 2)
    // **ACTION: Verify selectors for recent expense list items**
    const recentListSelector = '.recent-expenses table tbody tr';
    await expect(page.locator(recentListSelector).first()).toContainText(expense2.category); // Most recent first
    await expect(page.locator(recentListSelector).first()).toContainText(testCurrencySymbol + expense2.amount);
    await expect(page.locator(recentListSelector).nth(1)).toContainText(expense1.category);
    await expect(page.locator(recentListSelector).nth(1)).toContainText(testCurrencySymbol + expense1.amount);
    console.log('TEST: Dashboard Verification OK.');

    // --- Step 7: Verify View Expenses Page ---
    console.log('TEST: Verifying View Expenses Page...');
    // **ACTION: Verify selector for View Expenses link in sidebar**
    await page.locator('.sidebar-nav a.nav-link:has-text("View Expenses")').click();
    await expect(page.locator('h2:has-text("Expense List")')).toBeVisible({ timeout: 10000 });

    // **ACTION: Verify selectors for table rows on this page**
    const viewListRowSelector = '.table-container tbody tr'; // Assuming same table container as reports
    // Find rows based on unique notes text
    const row1 = page.locator(viewListRowSelector, { hasText: expense1.notes });
    const row2 = page.locator(viewListRowSelector, { hasText: expense2.notes });

    await expect(row1).toBeVisible();
    await expect(row1).toContainText(todayFormatted);
    await expect(row1).toContainText(expense1.category);
    await expect(row1).toContainText(testCurrencySymbol + expense1.amount);

    await expect(row2).toBeVisible();
    await expect(row2).toContainText(todayFormatted);
    await expect(row2).toContainText(expense2.category);
    await expect(row2).toContainText(testCurrencySymbol + expense2.amount);
    console.log('TEST: View Expenses Page Verification OK.');

    // --- Step 8: Verify Reports Page & Filter ---
    console.log('TEST: Verifying Reports Page...');
    // **ACTION: Verify selector for Reports link in sidebar**
    await page.locator('.sidebar-nav a.nav-link:has-text("Reports")').click();
    await expect(page.locator('h2:has-text("Reports")')).toBeVisible({ timeout: 10000 });

    // Check chart totals (e.g., Last 7 Days chart should include today's expenses)
    // **ACTION: Verify selector for chart container/total text**
    // This selector might need adjustment based on how total is displayed
    const chartTotalSelector = '.chart-container:has(h3:has-text("Last 7 Days")) h3';
    await expect(page.locator(chartTotalSelector)).toContainText(testCurrencySymbol + totalMonthlySpending, { timeout: 15000 }); // Wait longer for charts

    // Check list on reports page initially shows both
    const reportsListRowSelector = '.expenses-list-section .table-container tbody tr';
    await expect(page.locator(reportsListRowSelector)).toHaveCount(2, { timeout: 10000 });

    // Test category filter
    console.log('TEST: Testing category filter...');
    const categoryFilterSelector = '#categoryFilter';
    await page.locator(categoryFilterSelector).selectOption({ label: expense1.category }); // Filter for Food
    await expect(page.locator(reportsListRowSelector)).toHaveCount(1); // Expect only 1 row
    await expect(page.locator(reportsListRowSelector).first()).toContainText(expense1.notes); // Check it's the right one
    await expect(page.locator(reportsListRowSelector).first()).toContainText(testCurrencySymbol + expense1.amount);

    // Clear filter
    await page.locator(categoryFilterSelector).selectOption({ value: '' }); // Select "All Categories"
    await expect(page.locator(reportsListRowSelector)).toHaveCount(2); // Expect both rows again
    console.log('TEST: Reports Page Verification OK.');

    // --- Step 9: Test Export Buttons (Basic Click) ---
    console.log('TEST: Testing export buttons...');
    // **ACTION: Verify selectors for export buttons**
    const csvButtonSelector = '.export-section button:has-text("Export as CSV")';
    const pdfButtonSelector = '.export-section button:has-text("Export as PDF")';

    // We won't verify the download, just click and ensure no immediate error
    await page.locator(csvButtonSelector).click();
    await page.waitForTimeout(1000); // Brief pause
    await page.locator(pdfButtonSelector).click();
    await page.waitForTimeout(1000); // Brief pause
    console.log('TEST: Export buttons clicked (no verification of download).');

    // --- Step 10: Logout ---
    console.log('TEST: Logging out...');
    // **ACTION: Verify selector for logout button**
    await page.locator('.sidebar-nav button.logout-button').click();

    // Expect redirection to Login page
    await expect(page.locator('h2:has-text("Login")')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/login', { timeout: 10000 });
    console.log('TEST: Logout Successful.');

  }); // End of main test case

}); // End of describe block