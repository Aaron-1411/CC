'use client';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Props {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function SparkLine({ data, color, width = 80, height = 28 }: Props) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-[var(--bg-raised)] rounded opacity-30" />;
  }

  const isPositive = data[data.length - 1] >= data[0];
  const lineColor = color ?? (isPositive ? 'var(--positive)' : 'var(--negative)');
  const points = data.map((v, i) => ({ v, i }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={lineColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
