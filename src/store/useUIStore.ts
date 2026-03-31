import { create } from 'zustand';

interface UIState {
  dateRange: { start: string; end: string } | null;
  sidebarOpen: boolean;
  personFilter: string | null;
  accountFilter: string | null;
  setDateRange: (range: { start: string; end: string } | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPersonFilter: (personId: string | null) => void;
  setAccountFilter: (accountId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  dateRange: null,
  sidebarOpen: true,
  personFilter: null,
  accountFilter: null,
  setDateRange: (dateRange) => set({ dateRange }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setPersonFilter: (personFilter) => set({ personFilter }),
  setAccountFilter: (accountFilter) => set({ accountFilter }),
}));
