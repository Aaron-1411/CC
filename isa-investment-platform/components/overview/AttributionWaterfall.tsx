'use client';
import { usePortfolio } from '@/hooks/usePortfolio';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer,
} from 'recharts';
import { HOLDING_COLORS } from '@/lib/constants';

export function AttributionWaterfall() {
  const { positions, totalDailyChangeGBP, totalValueGBP } = usePortfolio();

  const data = [...positions]
    .map((p) => ({
      ticker: p.ticker,
      contribution: totalValueGBP > 0 ? (p.dailyChangeGBP / (totalValueGBP - totalDailyChangeGBP)) * 100 : 0,
      contributionGBP: p.dailyChangeGBP,
    }))
    .sort((a, b) => b.contributionGBP - a.contributionGBP);

  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
        Today&apos;s contribution to return
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 9, fontFamily: 'var(--font-ibm-plex-mono)' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            type="category" dataKey="ticker"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)' }}
            axisLine={false} tickLine={false} width={50}
          />
          <Tooltip
            contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-normal)', borderRadius: 8, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11 }}
            formatter={(v, _name, props) => {
              const val = Number(v);
              const gbp = Number((props.payload as { contributionGBP: number })?.contributionGBP ?? 0);
              return [`${val >= 0 ? '+' : ''}${val.toFixed(3)}% (£${gbp >= 0 ? '+' : ''}${gbp.toFixed(2)})`, 'Contribution'] as [string, string];
            }}
          />
          <ReferenceLine x={0} stroke="var(--border-normal)" />
          <Bar dataKey="contribution" radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell
                key={entry.ticker}
                fill={entry.contributionGBP >= 0 ? 'var(--positive)' : 'var(--negative)'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
