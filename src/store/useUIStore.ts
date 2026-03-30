import { create } from 'zustand';

interface UIState {
  dateRange: { start: string; end: string } | null;
  sidebarOpen: boolean;
  setDateRange: (range: { start: string; end: string } | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  dateRange: null,
  sidebarOpen: true,
  setDateRange: (dateRange) => set({ dateRange }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
