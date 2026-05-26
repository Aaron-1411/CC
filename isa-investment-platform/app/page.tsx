'use client';
import { useLivePrices } from '@/hooks/useLivePrices';
import { PortfolioHeader } from '@/components/overview/PortfolioHeader';
import { PerformancePeriodCards } from '@/components/overview/PerformancePeriodCards';
import { EquityCurve } from '@/components/overview/EquityCurve';
import { HoldingsTable } from '@/components/overview/HoldingsTable';
import { RiskSnapshot } from '@/components/overview/RiskSnapshot';
import { AttributionWaterfall } from '@/components/overview/AttributionWaterfall';
import { NewsFeed } from '@/components/overview/NewsFeed';

function PriceStreamer() {
  useLivePrices();
  return null;
}

export default function OverviewPage() {
  return (
    <>
      <PriceStreamer />
      <PortfolioHeader />
      <div className="px-4 lg:px-6 py-4 space-y-5 max-w-[1200px]">
        {/* Performance period selector */}
        <section>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Performance</div>
          <PerformancePeriodCards />
        </section>

        {/* Equity curve */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <EquityCurve />
        </section>

        {/* Holdings table */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Holdings</div>
          <HoldingsTable />
        </section>

        {/* Risk snapshot */}
        <section>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Risk</div>
          <RiskSnapshot />
        </section>

        {/* Attribution */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <AttributionWaterfall />
        </section>

        {/* News */}
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Portfolio News</div>
          <NewsFeed />
        </section>
      </div>
    </>
  );
}
