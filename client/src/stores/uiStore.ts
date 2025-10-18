import { create } from "zustand";

interface UIState {
  // Week view configuration
  selectedDate: Date;

  // Sidebar state
  isSidebarCollapsed: boolean;

  // Actions
  setSelectedDate: (date: Date) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: new Date(),
  isSidebarCollapsed: false,

  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}));
