'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PriceFlash } from '@/components/shared/PriceFlash';
import { SparkLine } from '@/components/shared/SparkLine';
import { HOLDING_COLORS } from '@/lib/constants';
import type { LivePosition } from '@/store/portfolioStore';

type Filter = 'all' | 'etf' | 'stock' | 'positive' | 'negative';

export function HoldingsTable() {
  const router = useRouter();
  const { positions, totalValueGBP } = usePortfolio();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'currentValueGBP', desc: true }]);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    return positions.filter((p) => {
      if (filter === 'etf') return p.type === 'ETF';
      if (filter === 'stock') return p.type === 'Stock';
      if (filter === 'positive') return p.dailyPct >= 0;
      if (filter === 'negative') return p.dailyPct < 0;
      return true;
    });
  }, [positions, filter]);

  const columns = useMemo<ColumnDef<LivePosition>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Instrument',
        cell: ({ row }) => {
          const p = row.original;
          const color = HOLDING_COLORS[p.ticker] ?? '#8896b0';
          return (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                  {p.name.length > 24 ? p.name.slice(0, 24) + '…' : p.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono bg-[var(--bg-overlay)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">{p.ticker}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${p.type === 'ETF' ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-soft)]' : 'bg-[#1e1a2e] text-[#bc8cff] border-[#4a3d7a]'}`}>{p.type}</span>
                </div>
              </div>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'currentValueGBP',
        accessorKey: 'currentValueGBP',
        header: 'Value',
        cell: ({ getValue }) => (
          <PriceFlash value={getValue() as number}>
            <span className="font-mono tabular-nums text-sm text-[var(--text-primary)]">
              £{(getValue() as number).toFixed(2)}
            </span>
          </PriceFlash>
        ),
      },
      {
        id: 'weight',
        accessorKey: 'weight',
        header: 'Weight',
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
            {((getValue() as number) * 100).toFixed(2)}%
          </span>
        ),
      },
      {
        id: 'dailyPct',
        accessorKey: 'dailyPct',
        header: 'Day %',
        cell: ({ getValue }) => {
          const v = getValue() as number;
          return (
            <PriceFlash value={v}>
              <span className={`font-mono tabular-nums text-sm font-semibold ${v >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {v >= 0 ? '+' : ''}{v.toFixed(2)}%
              </span>
            </PriceFlash>
          );
        },
      },
      {
        id: 'dailyChangeGBP',
        accessorKey: 'dailyChangeGBP',
        header: 'Day £',
        cell: ({ getValue }) => {
          const v = getValue() as number;
          return (
            <span className={`font-mono tabular-nums text-sm ${v >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {v >= 0 ? '+' : '−'}£{Math.abs(v).toFixed(2)}
            </span>
          );
        },
      },
      {
        id: 'unrealisedPnLGBP',
        accessorFn: (row) => row.unrealisedPnLGBP,
        header: 'Unrealised',
        cell: ({ row }) => {
          const gbp = row.original.unrealisedPnLGBP;
          const pct = row.original.unrealisedPnLPct;
          if (gbp == null) return <span className="font-mono text-xs text-[var(--text-tertiary)]">—</span>;
          const pos = gbp >= 0;
          return (
            <PriceFlash value={gbp}>
              <div>
                <div className={`font-mono tabular-nums text-sm font-semibold ${pos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {pos ? '+' : '−'}£{Math.abs(gbp).toFixed(2)}
                </div>
                {pct != null && (
                  <div className={`font-mono tabular-nums text-[10px] ${pos ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {pos ? '+' : ''}{pct.toFixed(2)}%
                  </div>
                )}
              </div>
            </PriceFlash>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'etf', label: 'ETFs' },
    { key: 'stock', label: 'Stocks' },
    { key: 'positive', label: '↑ Positive' },
    { key: 'negative', label: '↓ Negative' },
  ];

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 text-[11px] font-mono rounded-full border flex-shrink-0 transition-colors ${
              filter === f.key
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[var(--border-subtle)]">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="pb-2 pr-4 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/holdings/${row.original.ticker}`)}
                className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2.5 pr-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
