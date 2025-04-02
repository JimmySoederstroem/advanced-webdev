# Project phase 1 - Definition and planning

Expense Tracker - Phase 1: Definition & Planning

## 1. User Personas

Persona 1: Sarah Johnson

Age: 28

Occupation: Freelance Designer

Tech Level: Medium

Goals: Wants to track monthly expenses easily and analyze spending trends.

Pain Points: Finds spreadsheets too complex, often forgets to log expenses.

Behavior: Uses web apps on both desktop and mobile; prefers simple, intuitive interfaces.


Persona 2: Mark Evans

Age: 35

Occupation: Small Business Owner

Tech Level: High

Goals: Wants to categorize business expenses and export data for tax reporting.

Pain Points: Needs clear transaction categories, easy export options, and automated calculations.

Behavior: Uses financial apps frequently; values automation and reporting features.


Age: 22

Occupation: University Student

Tech Level: Medium

Goals: Wants to set budgets and track personal spending habits to save money.

Pain Points: Struggles with overspending and wants alerts when exceeding budget limits.

Behavior: Primarily mobile user; prefers push notifications and visual data representation.



## 2. Use Cases and User Flows

**1. User Registers an Account (Authentication)**

Actors: User, System

Preconditions: User does not have an account.

Flow of Events:

User navigates to the registration page.

User inputs email, name, and password.

System validates inputs and checks for existing email.

If valid, system creates an account and stores encrypted password.

User receives a confirmation email and can now log in.

Outcome: User successfully registers and can start using the app.


**2. User Adds a New Expense (Data Entry)**

Actors: User, System

Preconditions: User must be logged in.

Flow of Events:

User clicks on the "Add Expense" button.

User enters amount, category, date, and optional notes.

System validates and stores expense in the database.

System updates total spending and displays the new entry.

Outcome: Expense is successfully added and visible in the dashboard.


**3. User Views Expense Reports (Data Visualization)**

Actors: User, System

Preconditions: User has recorded expenses.

Flow of Events:

User navigates to the "Reports" section.

System fetches and categorizes expense data.

System generates graphs and statistics (e.g., pie chart of spending by category).

User can filter by date range, category, or custom tags.

Outcome: User gains insights into spending patterns through graphical reports.


**4. User Sets a Budget and Gets Alerts (Budgeting Feature)**

Actors: User, System

Preconditions: User must be logged in and have recorded expenses.

Flow of Events:

User navigates to "Settings" and sets a monthly budget.

System stores the budget limit and tracks spending against it.

When expenses reach 80% of the budget, the system sends a warning.

If expenses exceed 100%, the system sends an alert.

Outcome: User is notified when approaching or exceeding budget limits.


**5. User Exports Transactions as PDF (Data Exporting)**

Actors: User, System

Preconditions: User must be logged in and have recorded expenses.

Flow of Events:

User goes to "Export Data" section.

User selects a date range and exports PDF.

System generates the file and provides a download link.

Outcome: User successfully downloads an expense report for offline use.



## 3. UI Prototypes

<<<<<<< HEAD

=======
![Registration](https://github.com/user-attachments/assets/a15c9d57-eb1f-4eec-a13a-5b9e5a7c8d47)

![Login](https://github.com/user-attachments/assets/4fb9524a-4ea4-47bf-a21d-c31a5b1281ca)

![Dashboard](https://github.com/user-attachments/assets/fa6f9486-4577-480b-9190-b2be2ba75aee)

![Add expense](https://github.com/user-attachments/assets/cfaeb044-f19d-40e7-ba15-fbedf33e6482)

![Reports](https://github.com/user-attachments/assets/752e670f-3317-46e7-821b-7d453e1d2a12)

![Settings](https://github.com/user-attachments/assets/bb8e7a7d-2542-43a8-abbf-5096907e2806)

**Colors will be added during the implementation!**
>>>>>>> eccc2f27e9025ddd3880b4cf172f7419e0bba18f

## 4. Information Architecture and Technical Design

Technology Stack:

Frontend: React

Backend: Node.js with Express

Database: MongoDB

APIs: REST API

Hosting: Google Cloud


Database Schema (MongoDB/PostgreSQL)

Users Table: id, name, email, password_hash

Expenses Table: id, user_id, amount, category, date, notes

Categories Table: id, name, icon

API Endpoints (Node.js & Express)

POST /register → User registration

POST /login → User authentication

GET /expenses → Fetch user expenses

POST /expenses → Add new expense

GET /reports → Generate spending reports

GET /export → Download expense data

Frontend (React Components Breakdown)

Dashboard.jsx (Shows total spending)

AddExpenseForm.jsx (Form for adding expenses)

ExpenseList.jsx (List of all expenses)

Reports.jsx (Charts & insights)

## 5. Project Management and User Testing

✅ Timeline & Milestones:

Week 1: Planning (Personas, Use Cases, UI Wireframes)

Week 2: Backend Setup (Database & API)

Week 3: Frontend Development (React Components)

Week 4: Testing & Deployment

✅ Agile Methodology (Trello Board)

Tasks categorized as Backlog, In Progress, Done

✅ User Testing Plan:

Conduct user tests with 5 different people

Gather feedback on UI/UX & functionality

Make iterative improvements based on feedback
