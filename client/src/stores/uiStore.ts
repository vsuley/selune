import { create } from "zustand";
import type { WeekStart } from "../utils/dateHelpers";

interface UIState {
  // Week view configuration
  weekStartsOn: WeekStart;
  selectedDate: Date;

  // Sidebar state
  isSidebarCollapsed: boolean;

  // Actions
  setWeekStartsOn: (weekStartsOn: WeekStart) => void;
  setSelectedDate: (date: Date) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Default to Monday start (1), can be changed to Sunday (0)
  weekStartsOn: 1,
  selectedDate: new Date(),
  isSidebarCollapsed: false,

  setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}));
