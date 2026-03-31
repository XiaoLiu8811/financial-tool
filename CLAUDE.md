# CLAUDE.md

## Project Overview
Home financial management app — CSV import, transaction categorization, spending/income visualization, and financial health dashboard. Client-side only (no backend), data persisted in IndexedDB.

## Tech Stack
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (uses `@import "tailwindcss"` and `@theme` syntax via `@tailwindcss/vite` plugin)
- **State**: Zustand (3 stores: transactions, categories, UI)
- **Storage**: Dexie (IndexedDB wrapper) with versioned schema (currently v2)
- **Charts**: Recharts 3
- **CSV**: PapaParse
- **Routing**: react-router-dom v7

## Commands
- `npm run dev` — start dev server
- `npm run build` — type-check then build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npm run preview` — preview production build

## Project Structure
```
src/
  types/          — TypeScript interfaces (transaction, financial, chart)
  lib/            — Core logic (csv-parser, categorization-engine, financial-metrics,
                    transaction-linker, default-categories, storage)
  store/          — Zustand stores (useTransactionStore, useCategoryStore, useUIStore)
  hooks/          — Custom hooks (useFilteredTransactions)
  components/
    layout/       — AppShell, Sidebar, Header
    import/       — CSVDropZone, ColumnMapper, ImportPreview
    transactions/ — TransactionTable, TransactionDetail
    categories/   — CategoryManager, CategoryRuleEditor, CategoryBadge
    charts/       — SpendingVsIncome, CategoryBreakdown, SpendingTrend, SavingsRate, DrillDownModal
    health/       — HealthDashboard, MetricCard
    ui/           — Modal, EmptyState
  pages/          — DashboardPage, TransactionsPage, ImportPage, CategoriesPage
```

## Architecture Notes
- **Storage layer** (`src/lib/storage.ts`): Dexie DB with tables: transactions, importBatches, categories, categoryRules. Schema changes require version bump.
- **Duplicate detection**: Two-tier — file-level hash (warns on re-import) + row-level transaction hash (highlights individual duplicates).
- **Transfer linking**: Bidirectional via `linkedTransactionId` and `isLinkedTransfer` fields. Linked transfers are excluded from financial metrics to prevent double-counting.
- **Categorization**: Priority-based keyword matching engine. Falls back to 'cat-uncategorized'. Supports auto and manual sources.
- **Charts are interactive**: Clicking chart elements opens a DrillDownModal showing matching transactions.

## Known Patterns / Pitfalls
- **Do NOT define React components inside other components' render functions** — causes input focus loss. Use JSX variables instead (see CategoryManager.tsx for the fix).
- **Recharts type issues**: Some Tooltip formatter and event handler types require `any` casts with eslint-disable comments.
- **Amount parsing**: Handles split income/expense columns — check for `!== null && !== 0`, not truthiness.
- **Tailwind v4**: No `tailwind.config.js` — theme is configured in `src/index.css` using `@theme` directive.

## Repository
- GitHub: https://github.com/XiaoLiu8811/financial-tool
- Branch: main
