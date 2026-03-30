# Home Finance Tracker

A client-side personal finance app that helps you visualize spending, track income, and understand your financial health. Import bank statements as CSV files and get instant insights through interactive charts and smart categorization.

All data stays on your machine — no server, no account, no cloud. Everything is stored in your browser's IndexedDB.

## Features

### CSV Import
- Drag-and-drop or browse to upload `.csv` bank statements
- Auto-detects column mapping (date, description, amount)
- Supports single amount column or separate credit/debit columns
- Handles various date formats (MM/DD/YYYY, YYYY-MM-DD, etc.) and currency symbols
- **Duplicate detection** — warns if the same file was already imported and highlights duplicate transactions row-by-row

### Transaction Management
- Sortable, filterable, paginated transaction table
- **Bulk select and delete** — checkboxes with shift-click range selection
- **Import batch manager** — view, filter, or delete all transactions from a specific import
- Inline transaction detail modal with editable category and notes
- View original CSV data for any transaction

### Smart Categorization
- 12 built-in categories with keyword-based auto-categorization (Groceries, Dining, Transportation, Utilities, etc.)
- **Custom categories** — create your own with name, color, and type
- **Custom rules** — define keyword lists, set priority, use regex
- Re-categorize all transactions with one click (respects manual overrides)
- Create new categories directly from the transaction detail view

### Related Transaction Linking
- Detects related transactions across imports (e.g., a credit card purchase and the bank payment that paid it off)
- Matches by amount, date proximity, and transfer keywords
- **Linked transfers are excluded from totals** so spending isn't counted twice
- Link and unlink transactions manually from the detail view

### Interactive Dashboard
- **Income vs Expenses** — grouped bar chart by month
- **Spending by Category** — donut chart with legend
- **Spending Trend** — line chart over time
- **Savings Rate** — area chart showing savings percentage
- Click any chart element to drill down into the underlying transactions
- Financial health KPIs: total income, expenses, net savings, savings rate, top expense category, month-over-month change
- Date range filter applies across all pages

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Download and Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/XiaoLiu8811/financial-tool.git
   cd financial-tool
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open in your browser**

   Visit the URL shown in the terminal (usually `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder. You can serve it with any static file server:

```bash
npm run preview
```

## How to Use

1. **Import your data** — Go to the **Import CSV** page and upload a bank statement. The app will auto-detect columns. Review the preview and click "Import".

2. **Review transactions** — Go to **Transactions** to see all your data. Use search, category filter, and sorting to find what you need. Click any row for details.

3. **Manage categories** — Go to **Categories** to create custom categories, add keyword rules, or re-categorize all transactions.

4. **Link transfers** — If you imported statements from multiple accounts (e.g., credit card + checking), open a transfer transaction and click "Find Related Transactions" to link matching entries and avoid double-counting.

5. **View your dashboard** — The **Dashboard** shows your financial overview. Click on any chart element to see the transactions behind the numbers. Use the date range picker in the header to focus on a specific period.

## CSV Format

The app works with most bank CSV exports. It expects at minimum:
- A **date** column
- A **description** column
- An **amount** column (or separate credit/debit columns)

Example:

```csv
Date,Description,Amount
2026-01-15,Grocery Store,-85.50
2026-01-16,Direct Deposit,3200.00
2026-01-17,Electric Company,-120.00
```

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** — utility-first styling
- **Recharts** — interactive charts
- **Zustand** — state management
- **Dexie** (IndexedDB) — client-side persistent storage
- **PapaParse** — CSV parsing
- **date-fns** — date formatting
- **Lucide React** — icons

## License

This project is for personal use.
