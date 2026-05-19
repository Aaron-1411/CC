'use client';
import { create } from 'zustand';

type Period = '1D' | '5D' | '1M' | '3M' | 'YTD' | 'ITD';
type ChartRange = '1W' | '1M' | '3M' | '6M' | 'YTD' | 'All';

interface UiState {
  selectedPeriod: Period;
  chartRange: ChartRange;
  selectedTicker: string | null;
  sidebarOpen: boolean;
  setPeriod: (p: Period) => void;
  setChartRange: (r: ChartRange) => void;
  setSelectedTicker: (t: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedPeriod: '1D',
  chartRange: '1M',
  selectedTicker: null,
  sidebarOpen: false,
  setPeriod: (selectedPeriod) => set({ selectedPeriod }),
  setChartRange: (chartRange) => set({ chartRange }),
  setSelectedTicker: (selectedTicker) => set({ selectedTicker }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
