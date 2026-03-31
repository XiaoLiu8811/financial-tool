import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ImportPage } from './pages/ImportPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { HouseholdPage } from './pages/HouseholdPage';
import { useTransactionStore } from './store/useTransactionStore';
import { useCategoryStore } from './store/useCategoryStore';
import { useHouseholdStore } from './store/useHouseholdStore';

function App() {
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const loadCategories = useCategoryStore(s => s.loadCategories);
  const loadHousehold = useHouseholdStore(s => s.loadHousehold);

  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadHousehold();
  }, [loadTransactions, loadCategories, loadHousehold]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/household" element={<HouseholdPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
