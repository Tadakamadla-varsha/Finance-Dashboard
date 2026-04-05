FinanceVault is a modern, responsive personal finance dashboard that helps users track income, expenses, and gain insights into their financial habits. It features interactive charts, filtering tools, and role-based access for enhanced usability.


FinanceVault is a front-end web application built using HTML, CSS, and JavaScript. It provides users with a clean interface to:

Monitor their financial balance
Track income and expenses
Analyze spending patterns
Manage transactions efficiently

The app is designed with a modular UI, smooth interactions, and a focus on clarity and usability.

 Setup Instructions
1. Clone or Download the Project
git clone https://github.com/your-username/financevault.git
cd financevault

Or simply download the ZIP and extract it.

2. Project Structure
financevault/
│
├── index.html       # Main dashboard UI
├── style.css        # Styling and layout
├── script.js        # Application logic
└── README.md        # Project documentation
3. Run the Project

No build tools or dependencies required.

Option A: Open Directly
Double-click index.html
Option B: Use Live Server (Recommended)

If using VS Code:

Install Live Server extension
Right-click index.html
Click "Open with Live Server"

 Approach & Architecture
1. Component-Based Layout

The UI is divided into logical sections:

Sidebar (navigation + role control)
Topbar (title + actions)
Tab Sections:
Overview
Transactions
Insights

Each section is dynamically shown/hidden using JavaScript.

2. State Management (Vanilla JS)
Transactions are stored in JavaScript (likely array-based)
UI updates are triggered after every state change
Filters, sorting, and pagination operate on derived data
3. Data Flow
User Input → State Update → UI Re-render → Charts Update

Examples:

Adding a transaction → updates totals + charts
Applying filters → updates visible table rows
Switching tabs → toggles sections
4. Chart Rendering

Charts are built using SVG (no external libraries):

Line chart → balance trend
Donut chart → category breakdown
Bar chart → income vs expenses

This keeps the app lightweight and dependency-free.

5. Role-Based UI

Two roles:

👁 Viewer → Read-only access
⚡ Admin → Can add/edit transactions

UI elements (like buttons) are conditionally shown based on role.

✨ Features
📊 Dashboard Overview
Total Balance
Total Income
Total Expenses
Percentage changes (delta indicators)
📈 Interactive Charts
Line Chart → Tracks balance over time
Donut Chart → Spending by category
Bar Chart → Monthly income vs expenses
📋 Transactions Management
Add new transactions (Admin only)
View all transactions in a table
Pagination support
🔍 Filtering & Search
Search by description or category
Filter by:
Type (Income/Expense)
Category
Month
Clear filters instantly
🔃 Sorting

Click table headers to sort by:

Date
Description
Category
Type
Amount
🧾 Export
Export all transactions as CSV file

 Insights Section
Highlights financial patterns
Displays key observations
Visual comparison of income vs expenses

 Role Switching
Toggle between:
Viewer mode
Admin mode
UI updates dynamically

 UI Enhancements
Toast notifications
Modal forms
Smooth transitions
Responsive layout
