'use client';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TrendPoint } from '@/lib/dto';
import { roundForDisplay } from '@/lib/engine';

export default function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const hasData = trend.some((p) => p.kgCO2e > 0);
  if (!hasData) {
    return <p className="text-sm text-[var(--color-ink-soft)]">No daily activity logged yet.</p>;
  }

  return (
    <div>
      <div aria-hidden className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0dccf" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => d.slice(5)}
              fontSize={11}
              stroke="#6b7771"
            />
            <YAxis fontSize={11} stroke="#6b7771" />
            <Line
              type="monotone"
              dataKey="kgCO2e"
              stroke="#0f4c45"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Daily footprint trend</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">kg CO₂e</th>
          </tr>
        </thead>
        <tbody>
          {trend.map((p) => (
            <tr key={p.date}>
              <th scope="row">{p.date}</th>
              <td>{roundForDisplay(p.kgCO2e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
