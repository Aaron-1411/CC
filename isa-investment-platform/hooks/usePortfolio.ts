'use client';
import { usePortfolioStore } from '@/store/portfolioStore';
import { HOLDING_COLORS } from '@/lib/constants';

export function usePortfolio() {
  const store = usePortfolioStore();

  const sortedByValue = [...store.positions].sort(
    (a, b) => b.currentValueGBP - a.currentValueGBP
  );

  const etfPositions = store.positions.filter((p) => p.type === 'ETF');
  const stockPositions = store.positions.filter((p) => p.type === 'Stock');

  const etfValueGBP = etfPositions.reduce((s, p) => s + p.currentValueGBP, 0);
  const stockValueGBP = stockPositions.reduce((s, p) => s + p.currentValueGBP, 0);

  const bestToday = [...store.positions].sort((a, b) => b.dailyPct - a.dailyPct)[0];
  const worstToday = [...store.positions].sort((a, b) => a.dailyPct - b.dailyPct)[0];

  return {
    ...store,
    sortedByValue,
    etfValueGBP,
    stockValueGBP,
    bestToday,
    worstToday,
    colors: HOLDING_COLORS,
  };
}
