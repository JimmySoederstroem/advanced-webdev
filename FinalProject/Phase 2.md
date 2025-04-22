# Project Phase 2 - Basic Structure and Main Functionalities

This report details the development progress during Phase 2, focusing on establishing the core architecture and implementing the primary functionalities of the Expense Tracker application.

## 1. Environment

The project utilizes two primary environments:

* **Development and Deployment (VM):** The application was deployed to a Google Cloud Compute Engine Virtual Machine (VM) running a Debian-based Linux distribution. The deployment environment utilizes:
    * **Nginx:** As a web server to serve the static frontend build and as a reverse proxy to route API requests to the backend application.
    * **PM2:** As a process manager to run the Node.js backend server continuously and manage restarts.
    * **PostgreSQL:** Installed directly on the VM to host the application database.
    * **Node.js:** Runtime environment for the backend server.
    * **VS Code Remote - SSH:** Used for connecting to, managing files on, and running commands on the VM during setup and deployment.

## 2. Backend

The backend is built using Node.js and the Express framework (`server.js`), providing a RESTful API for the frontend application.

* **Framework:** Express.js handles routing, middleware, and request/response processing.
* **Language:** JavaScript (Node.js).
* **Key Libraries:**
    * `express`: Core web framework.
    * `pg`: PostgreSQL client library for database interaction.
    * `cors`: Middleware to enable Cross-Origin Resource Sharing, allowing the frontend (served from a different origin during development or potentially via Nginx) to communicate with the API.
    * `bcrypt`: For securely hashing user passwords before storing them.
    * `jsonwebtoken` (JWT): For creating and verifying authentication tokens upon user login, enabling stateless authentication for protected routes.
    * `dotenv`: To manage environment variables (database URL, JWT secret, port) securely via a `.env` file.
    * `pdfkit`: To generate PDF documents for the export functionality.
* **API Endpoints (RESTful):** A set of HTTP endpoints were created to handle various functionalities (all prefixed with `/api` in the deployed version for Nginx proxying):
    * `POST /api/register`: User registration.
    * `POST /api/login`: User login and JWT generation.
    * `GET /api/expenses`: Fetch expenses (with filtering options).
    * `POST /api/expenses`: Add a new expense.
    * `DELETE /api/expenses/:id`: Delete a specific expense.
    * `GET /api/reports`: Fetch aggregated expense data for reporting.
    * `GET /api/export`: Generate and download expense data (CSV/PDF).
    * `GET /api/categories`: Fetch available expense categories.
    * `GET /api/settings`: Fetch user-specific settings (currency, budget).
    * `POST /api/settings`: Update user-specific settings.
    * `POST /api/reset-password`: Simple password reset functionality.
* **Authentication:** Implemented using JWT. The `authenticateToken` middleware verifies the token sent in the `Authorization` header for protected routes.

## 3. Frontend

The frontend is a single-page application (SPA) built using React.

* **Framework/Library:** React.
* **Build Tool:** Vite provides a fast development server and optimized production builds.
* **Language:** JavaScript (JSX).
* **Key Libraries:**
    * `react`: Core library for building UI components.
    * `react-dom`: For rendering React components in the browser.
    * `react-router-dom`: For handling client-side routing between different pages/views (e.g., `/login`, `/dashboard`, `/settings`).
    * `recharts`: For rendering the pie charts on the Reports page.
* **Core Components:** The UI is broken down into reusable components located in `src/components/`:
    * `App.jsx`: Main application component, handles routing logic and authentication state context.
    * `Login.jsx`, `Register.jsx`, `PasswordReset.jsx`, `TermsAndConditions.jsx`: Authentication and static pages.
    * `Dashboard.jsx`: Main view after login, shows summary cards and recent expenses.
    * `AddExpenseForm.jsx`: Form for adding new expenses.
    * `ExpenseList.jsx`: Reusable component to display lists of expenses (used on Dashboard, Reports, ViewExpensesPage). Handles fetching based on props.
    * `Reports.jsx`: Displays spending charts and the filterable expense list.
    * `Settings.jsx`: Form for updating user budget and currency.
    * `ViewExpensesPage.jsx`: Wrapper component for the dedicated "View Expenses" route, fetches settings and renders `ExpenseList`.
* **API Interaction:** Uses the browser's `fetch` API to make asynchronous requests to the backend REST API endpoints. Handles responses and updates the UI state accordingly.
* **Styling:** Primarily uses global CSS (`src/App.css`) for overall layout (including sidebar), base element styles, and utility classes. Component-specific styles were added as needed (e.g., `src/components/Settings.css`).

## 4. Database

A PostgreSQL relational database is used for data persistence.

* **Type:** PostgreSQL.
* **Database Name:** `expensetracker`.
* **User:** `expenser_user` (created with specific password).
* **Tables:**
    * `Users`: Stores user information (`id`, `name`, `email`, `password_hash`, `created_at`, `currency_code`). Email is unique. `currency_code` added via `ALTER TABLE`.
    * `Categories`: Stores predefined expense categories (`id`, `name`, `icon`). Name is unique. Initial categories were added via `INSERT`.
    * `Expenses`: Stores individual expense records (`id`, `user_id`, `amount`, `category_id`, `date`, `notes`, `created_at`). Includes foreign keys to `Users` and `Categories`.
    * `Budgets`: Stores monthly budget limits per user (`id`, `user_id`, `monthly_limit`, `month`, `year`, `created_at`). A unique constraint on `(user_id, month, year)` was added via `ALTER TABLE` to support `ON CONFLICT` logic.
* **Indexes:** Indexes were added (`idx_expenses_user_id`, `idx_expenses_date`, `idx_expenses_category_id`) to potentially improve query performance on the `Expenses` table, although with the current low data volume, their impact is minimal.

## 5. Basic structure and architecture

The application follows a standard client-server architecture:

1.  **Client (Frontend):** The React SPA runs in the user's browser. It handles UI rendering, user interaction, and client-side routing. It communicates with the backend via HTTP requests to the REST API.
2.  **Web Server / Reverse Proxy (Nginx):** Running on the VM, Nginx serves the static files (HTML, CSS, JS) generated by the `npm run build` command (from the `frontend/dist` folder). It also acts as a reverse proxy, directing requests starting with `/api/` to the backend Node.js application running on a different port (`localhost:5000`). This provides a single entry point (the VM's IP on port 80) for the user.
3.  **Server (Backend):** The Node.js/Express application listens for incoming API requests forwarded by Nginx. It handles business logic, authentication (validating JWTs), data validation, and interacts with the database.
4.  **Database (PostgreSQL):** Stores all persistent data (users, expenses, etc.) and responds to queries from the backend server.

Authentication is handled via JWT tokens generated upon login and verified by middleware on protected backend routes.

## 6. Functionalities

Based on the initial plan and subsequent development, the following core functionalities have been implemented:

* **User Authentication:** Secure registration with password hashing (`bcrypt`), login with password comparison, JWT generation and verification for session management, and logout.
* **Expense Management:** Users can add new expenses with amount, date, category, and optional notes. They can view lists of their expenses (recent on dashboard, full list on dedicated page and reports page). Expenses can be deleted.
* **Settings:** Users can set/update their preferred currency (from a predefined list) and set/update/clear their monthly budget limit. These settings are persisted per user.
* **Reporting:** A dedicated reports page displays:
    * Pie charts summarizing spending by category over different time periods (Last 7 days, Last Month, Last 3 Months, Last 6 Months). Chart totals reflect the user's selected currency.
    * A filterable and scrollable list of all expenses, allowing users to drill down into data and filter by category. Currency and dates are formatted correctly.
* **Data Export:** Users can export their expense data (optionally filtered by category on the Reports page) in CSV or PDF format. PDF generation uses `pdfkit`.
* **Basic Password Reset:** A simple page allows users to reset their password by providing their email and a new password (no email verification token implemented in this phase).
* **Terms and Conditions:** A static page displays terms, linked from the registration form checkbox.

## 7. Code quality and documentation

* **Modularity:** The frontend utilizes React components for UI modularity. The backend separates concerns using Express routing.
* **Configuration:** Sensitive configuration (database URL, JWT secret, port) is managed using environment variables via a `.env` file and the `dotenv` library, keeping secrets out of the codebase.
* **Asynchronous Operations:** `async/await` is used extensively in the backend (for database queries, password hashing) and frontend (for `fetch` calls) to handle asynchronous operations cleanly.
* **Comments:** Basic comments were added during development to explain certain sections or logic (e.g., in `server.js`, test files). More comprehensive commenting could be added for improved maintainability.
* **Readability:** Code generally follows standard JavaScript/React conventions.

## 8. Testing and error handling

* **End-to-End (E2E) Testing:** Playwright was set up in the frontend project. An example test script (`full-e2e.spec.js`) was created to demonstrate testing the main user workflow (register, login, add expense, verify, logout) by interacting with the UI elements of the deployed application. Tests are run using `npx playwright test`, and HTML reports can be generated.
* **Backend Error Handling:** Basic error handling is implemented using `try...catch` blocks in the route handlers. Database or other unexpected errors typically result in a generic 500 Internal Server Error response with a JSON message. Specific errors (like 400 Bad Request for invalid input, 401 Unauthorized for invalid credentials, 403 Forbidden for invalid JWT, 404 Not Found for missing resources, 409 Conflict for duplicate email) are handled where appropriate. Errors are logged to the console (and captured by PM2 logs).
* **Frontend Error Handling:** `fetch` calls include `.catch()` blocks or `try...catch` with `async/await` to handle network errors or non-OK HTTP responses from the API. Error messages received from the backend (or generated locally) are displayed to the user using component state and rendered in designated error message areas (e.g., `.error-message`).

## 9. User interface and interaction

* **Design Basis:** The UI implementation aimed to follow the structure and layout presented in the provided wireframe mockups (`Untitled.pdf`).
* **Layout:** A sidebar navigation layout was implemented for authenticated users, providing access to different application sections (Dashboard, Add Expense, View Expenses, Reports, Settings). Login, Register, and other public pages use a centered layout.
* **Key UI Elements:**
    * Forms for registration, login, password reset, adding expenses, and settings.
    * Summary cards on the Dashboard displaying key metrics (spending, budget).
    * A progress bar on the Dashboard visualizing budget usage.
    * Pie charts on the Reports page for visual spending analysis.
    * A filterable, scrollable table (`ExpenseList`) for displaying expense details.
    * Dropdowns for selecting categories and currency.
    * Checkboxes for terms and "remember me" (note: "remember me" logic wasn't fully implemented).
* **Responsiveness:** Basic responsiveness was considered (e.g., using CSS Grid for reports layout), but thorough testing and refinement across different screen sizes were not part of this phase.
* **Styling:** CSS (`App.css`, `Settings.css`) was used for styling, aiming for a clean and functional appearance based on the mockups.
