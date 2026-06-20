'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Category } from '@/lib/engine';
import { roundForDisplay } from '@/lib/engine';

const LABELS: Record<Category, string> = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Home energy',
  goods: 'Purchases',
};
const COLORS: Record<Category, string> = {
  transport: '#0f4c45',
  food: '#1f7a4d',
  energy: '#2f8f83',
  goods: '#9a6700',
};

export default function CategoryDonut({ byCategory }: { byCategory: Record<Category, number> }) {
  const data = (Object.keys(LABELS) as Category[])
    .map((c) => ({ category: c, label: LABELS[c], value: byCategory[c] }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <p className="text-sm text-[var(--color-ink-soft)]">No data for this period yet.</p>;
  }

  return (
    <div>
      {/* Visual chart — hidden from assistive tech, which uses the table below. */}
      <div aria-hidden className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.category} fill={COLORS[d.category]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible equivalent: a real data table + a visible legend. */}
      <table className="mt-2 w-full text-sm">
        <caption className="sr-only">Footprint by category for the selected period</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Category</th>
            <th scope="col">kg CO₂e</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.category} className="border-t border-[var(--color-border)]">
              <th scope="row" className="flex items-center gap-2 py-1.5 text-left font-normal">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[d.category] }}
                />
                {d.label}
              </th>
              <td className="py-1.5 text-right tabular-nums">{roundForDisplay(d.value)}</td>
              <td className="py-1.5 text-right tabular-nums text-[var(--color-ink-faint)]">
                {Math.round((d.value / total) * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
