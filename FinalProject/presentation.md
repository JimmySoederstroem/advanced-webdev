# Expense Tracker - Project Presentation

**Phase 4 – Project Presentation**

---

## Introduction to the Project

* **Project Goal:** To develop a functional, web-based Expense Tracker application.
* **Core Purpose:** To help users manage their personal or small business finances by tracking expenses, setting budgets, analyzing spending, and exporting data.
* **Target Users (Personas from Phase 1):**
    * **Sarah (Freelancer):** Needs easy expense logging and trend analysis.
    * **Mark (Small Business Owner):** Requires categorization and data export for tax purposes.
    * **Alex (Student):** Wants budget setting, spending habit tracking, and alerts.
* **Technology Stack Chosen:**
    * **Frontend:** React (with Vite)
    * **Backend:** Node.js with Express.js
    * **Database:** PostgreSQL
    * **API Style:** RESTful API
    * **Deployment:** Google Cloud VM with Nginx and PM2

---


## Use Case 1 - User Registers an Account

* **Planned Flow:** User inputs email, name, password -> System validates, checks for existing email -> Creates account (encrypts password) -> Sends confirmation email -> User can log in.
* **Implementation Status:** **Mostly Implemented**

**How it was Implemented:**

* **Frontend (`src/components/Register.jsx`):**
    * A dedicated registration page (`/register`) provides a form for email, name, password, and password confirmation.
    * Includes client-side checks for matching passwords and minimum length.
    * A checkbox for "I accept terms and conditions" was added, linking to a `/terms` page.
    * On submit, user data is sent to the backend using the `fetch` API.
        ```javascript
        // Register.jsx - Simplified Fetch
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        // ... error handling and navigation ...
        ```
* **Backend (`POST /api/register` in `server.js`):**
    * Receives registration data.
    * Validates input.
    * Checks the `Users` table in PostgreSQL to ensure the email is not already in use.
        ```javascript
        // server.js - Email check
        const userExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) { /* return 409 conflict */ }
        ```
    * Hashes the password securely using `bcrypt`.
        ```javascript
        // server.js - Password Hashing
        const password_hash = await bcrypt.hash(password, saltRounds);
        ```
    * Inserts the new user (with hashed password and default currency) into the `Users` table.
        ```javascript
        // server.js - User Insert
        const newUser = await pool.query(
          'INSERT INTO Users (name, email, password_hash, currency_code) VALUES ($1, $2, $3, $4) RETURNING ...',
          [name, email, password_hash, 'USD'] // Default currency
        );
        ```
    * Returns a success message. The frontend then redirects to the login page.

**Why "Mostly" & Future Implementation:**
* **Left Out:** The "Sends confirmation email" step was not implemented.
* **Reason:** Setting up an email sending service (e.g., SendGrid, Mailgun, or SMTP server configuration) was outside the scope of core functionality for this phase to keep complexity manageable.
* **Future:** Could be implemented by integrating an email library (like Nodemailer) in the backend and calling it after successful user creation. This would involve generating a unique token, sending an email with a verification link, and having another endpoint to confirm the email.

---

## Use Case 2 - User Adds a New Expense

* **Planned Flow:** Logged-in user clicks "Add Expense" -> Enters Amount, Category, Date, Notes -> System validates & stores -> UI updates.
* **Implementation Status:** **Fully Implemented**

**How it was Implemented:**

* **Frontend (`src/components/AddExpenseForm.jsx`):**
    * Accessible from the sidebar link (`/add`) for authenticated users.
    * Form provides inputs for amount, a date picker, a category dropdown, and an optional notes textarea.
    * Categories for the dropdown are fetched dynamically from the backend (`GET /api/categories`).
        ```javascript
        // AddExpenseForm.jsx - Fetching categories
        useEffect(() => {
            const fetchCategories = async () => {
                const response = await fetch('/api/categories', { headers: { 'Authorization': `Bearer ${authToken}` }});
                // ... set categories state ...
            };
            fetchCategories();
        }, [authToken]);
        ```
    * Submits expense data to the backend.
* **Backend (`POST /api/expenses` in `server.js`):**
    * This is a protected route requiring a valid JWT.
    * Receives expense data (amount, `category_id`, date, notes).
    * Performs basic validation.
    * Inserts the new expense into the `Expenses` table in PostgreSQL, associating it with the logged-in `user_id` and the selected `category_id`.
        ```javascript
        // server.js - Insert Expense
        const result = await pool.query(
          'INSERT INTO Expenses (user_id, amount, category_id, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [userId, amount, category_id, date, notes]
        );
        // ... return new expense ...
        ```
    * The frontend displays a success message.

---

## Use Case 3 - User Views Expense Reports

* **Planned Flow:** User navigates to Reports -> System fetches/aggregates data -> Displays graphs/stats by category -> Allows filtering (date, category, tag).
* **Implementation Status:** **Implemented**

**How it was Implemented:**

* **Frontend (`src/components/Reports.jsx`):**
    * Accessible via sidebar link (`/reports`).
    * Fetches user settings (`GET /api/settings`) to determine the preferred currency for display.
    * Fetches aggregated data for charts from `GET /api/reports` for predefined periods (Last 7 days, Last Month, etc.).
    * Uses the `recharts` library to display 4 Pie Charts showing spending by category. Chart totals and tooltips are formatted with the user's currency.
        ```javascript
        // Reports.jsx - Example chart rendering (simplified)
        {renderPieChart(reportData.week, 'Last 7 Days', loadingCharts.week)}
        // renderPieChart uses userSettings.currencyCode for formatting
        ```
    * Displays a detailed, scrollable list of expenses using the `ExpenseList.jsx` component.
    * Includes a dropdown to filter the *expense list* by category (categories fetched from `GET /api/categories`).
* **Backend (`GET /api/reports` in `server.js`):**
    * Protected route.
    * Uses SQL `SUM()`, `COUNT()`, and `GROUP BY c.name` to aggregate expense data by category name.
    * Supports `startDate` and `endDate` query parameters for filtering the aggregated data.
        ```javascript
        // server.js - Report Query (simplified)
        let query = `SELECT c.name as category_name, SUM(e.amount) as total_amount, COUNT(e.id) as transaction_count
                     FROM Expenses e JOIN Categories c ON e.category_id = c.id
                     WHERE e.user_id = $1`;
        // ... append date filters if provided ...
        query += ' GROUP BY c.name ORDER BY total_amount DESC';
        ```


* **Future:**
    * Add date range input components to `Reports.jsx` and pass selected dates to the `fetchChartDataForPeriod` and `ExpenseList` component.
    * Implement a tagging system: new database table for tags, a table linking tags to expenses, UI for adding/managing tags, and backend/frontend logic for filtering by tags.

---

## Use Case 4 - User Sets a Budget and Gets Alerts

* **Planned Flow:** User navigates to Settings -> Sets monthly budget -> System stores/tracks -> Alerts user at 80%/100% threshold.
* **Implementation Status:** **Implemented**

**How it was Implemented (Setting & Tracking):**

* **Frontend (`src/components/Settings.jsx`):**
    * Page at `/settings` allows users to input a `Monthly Budget` amount and select their preferred `Currency`.
    * Fetches current settings via `GET /api/settings` on load.
    * Saves changes via `POST /api/settings`.
* **Backend (`GET /api/settings`, `POST /api/settings` in `server.js`):**
    * `GET` retrieves `currency_code` from `Users` table and the latest `monthly_limit` from `Budgets` table.
    * `POST` updates `currency_code` in `Users` and uses an UPSERT (or DELETE if budget is cleared) for `monthly_limit` in the `Budgets` table for the current month/year.
        ```javascript
        // server.js - POST /api/settings (simplified UPSERT for budget)
        budgetValue !== null
            ? pool.query( `INSERT INTO Budgets (user_id, monthly_limit, month, year) VALUES ($1, $2, $3, $4)
                           ON CONFLICT (user_id, month, year) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit`, /*...*/)
            : pool.query( 'DELETE FROM Budgets WHERE user_id = $1 AND month = $2 AND year = $3', /*...*/)
        ```
* **Frontend (`src/components/Dashboard.jsx`):**
    * Fetches and displays the current monthly budget.
    * Calculates and displays total spending for the current month.
    * Shows the amount of budget remaining.
    * Includes a visual progress bar that changes color based on budget usage (>80% yellow, >100% red).
    * **Displays a prominent UI alert banner** at the top of the dashboard when budget thresholds (80%, 100%) are met.
        ```javascript
        // Dashboard.jsx - Simplified Alert Logic
        useEffect(() => {
            if (budget !== null && !isNaN(totalSpending)) {
                const percentageUsed = (totalSpending / budget) * 100;
                if (percentageUsed >= 100) { setBudgetAlert({ message: `Budget Exceeded! ...`, type: 'exceeded' }); }
                else if (percentageUsed >= 80) { setBudgetAlert({ message: `Warning: You've spent ...`, type: 'warning' }); }
                else { setBudgetAlert({ message: '', type: '' }); }
            } // ...
        }, [totalSpending, budget, summaryData.currencyCode]);
        ```


---

## Use Case 5 - User Exports Transactions

* **Planned Flow:** User goes to Reports/Export -> Selects date range -> Exports PDF -> Gets download link.
* **Implementation Status:** **Mostly Implemented**

**How it was Implemented:**

* **Frontend (`src/components/Reports.jsx`):**
    * "Export as CSV" and "Export as PDF" buttons are available.
    * The `handleExport` function calls the backend `GET /api/export` endpoint, passing the chosen `format` and any active `selectedCategoryId` from the page's filter.
        ```javascript
        // Reports.jsx - Simplified Export Fetch
        const response = await fetch(`/api/export?format=${format}&categoryId=${selectedCategoryId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        // ... handle blob response and trigger download ...
        ```
* **Backend (`GET /api/export` in `server.js`):**
    * Protected route.
    * Accepts `format`, `startDate`, `endDate`, and `categoryId` query parameters to filter the data fetched from the `Expenses` table.
    * For CSV: Manually constructs the CSV string (header and rows).
    * For PDF: Uses the `pdfkit` library to generate a PDF document with a simple tabular layout of expenses.
        ```javascript
        // server.js - Simplified PDF Generation
        if (format.toLowerCase() === 'pdf') {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="expenses.pdf"`);
            doc.pipe(res); // Stream PDF to response
            // ... doc.text() to add content from expensesData ...
            doc.end();
        }
        ```
    * Sets appropriate `Content-Type` and `Content-Disposition` headers.

**Why "Mostly" & Future Implementation:**
* **Left Out:** A dedicated UI on the Reports page for users to select specific `startDate` and `endDate` ranges *just for the export*. The backend *supports* these parameters, but the frontend currently only passes the category filter.
* **Reason:** Kept the export UI simple for this phase.
* **Future:** Add date input fields near the export buttons in `Reports.jsx`. Update `handleExport` to include these selected dates in the API request to `/api/export`.

---

## Technical Implementation & Development Process

* **Environment Setup:**
    * Local: Node.js, npm, PostgreSQL.
    * VM (Google Cloud): Debian Linux, Node.js, PostgreSQL, Nginx, PM2 installed and configured.
* **Backend Development (`server.js`):**
    * Express.js for routing and middleware.
    * RESTful API design with JSON request/response.
    * `pg` library for PostgreSQL interaction.
    * `bcrypt` for password hashing, `jsonwebtoken` for JWTs.
    * `dotenv` for environment variable management.
    * `pdfkit` for PDF generation.
* **Frontend Development (`src/`):**
    * React with Vite.
    * Component-based architecture.
    * `react-router-dom` for client-side navigation.
    * `fetch` API for backend communication.
    * Global CSS (`App.css`) and component-specific CSS (`Settings.css`).
    * `recharts` for data visualization.
* **Database Schema (`CREATE TABLE` scripts):**
    * Designed tables for Users, Categories, Expenses, Budgets with appropriate relationships and constraints.
    * Used `ALTER TABLE` to add `currency_code` to Users and `UNIQUE` constraint to Budgets.
* **Deployment Process (VM):**
    1.  VM setup and software installation.
    2.  PostgreSQL database & user creation, schema setup, initial data seeding (categories).
    3.  Code transfer (Git clone).
    4.  Backend: `npm install`, `.env` configuration, started with `pm2`.
    5.  Frontend: `npm install`, `npm run build` (created `dist` folder).
    6.  Nginx: Configured to serve static files from `frontend/dist` and reverse proxy `/api` requests to the Node.js backend.
    7.  GCP Firewall: Rules added to allow HTTP traffic (port 80).
* **Iterative Debugging:** Addressed issues related to proxy configuration (Vite dev vs. Nginx prod), database authentication, file permissions, module resolution, and CSS conflicts.

---

## Reflection and Future Ideas

* **What Went Well:**
    * Core functionalities for expense tracking, user management, and basic reporting were successfully implemented.
    * Deployment to a VM environment with Nginx and PM2 was achieved.
    * REST API design provided a clear separation between frontend and backend.
    * E2E testing setup with Playwright provides a good foundation for future automated testing.
* **Challenges:**
    * Deployment configuration (Nginx, PM2, firewall, paths) required careful setup and debugging.
    * Managing differences between local development proxy (Vite) and production proxy (Nginx) for API calls.
    * Build issues on the VM due to nested project structures and conflicting files.
    * Ensuring consistent UI styling and resolving CSS conflicts.
* **Future Ideas (Beyond planned gaps):**
    * **Enhanced Reporting:** More chart types, custom date range selection for charts, trend analysis.
    * **Recurring Expenses:** Functionality to set up and automatically log recurring expenses.
    * **File Attachments:** Allow users to attach receipts (images/PDFs) to expenses.
    * **User Profile Management:** Allow users to change their name, email (with verification), or password.
    * **Mobile Responsiveness:** Thoroughly test and improve UI for various screen sizes.
    * **Internationalization (i18n):** Support for multiple languages in the UI.
    * **Security Hardening:** Implement HTTPS, review input validation, set up more robust security headers.
    * **Cloud Native Deployment:** Explore migrating the backend to Cloud Run and database to Cloud SQL for better scalability and manageability.
    * **CI/CD Pipeline:** Automate testing and deployment processes.

---

## Total Hours Spent on Project

I have spent 52 hours on this project

---

## Demonstration

*(This slide is where you would switch to a live demonstration of the application running on the VM, walking through the implemented use cases.)*

* Register a new user.
* Log in with the new user.
* Go to Settings, set a currency and budget.
* Add a couple of expenses in different categories.
* Show the Dashboard (summary cards, budget progress with alerts, recent expenses).
* Show the "View Expenses" page.
* Show the Reports page (charts, category filter for the list).
* Demonstrate CSV and PDF export.
* Log out.

## Video
https://1drv.ms/v/c/4fafea72afb26931/EcYz3hmoU3lDiug2FDKVK7QBPHvlrIzK_SDd4OTDX4lUpg



