'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#1d3df5', '#ff9500', '#16a34a', '#9333ea', '#e11d48', '#0891b2', '#ca8a04', '#0ea5e9', '#f97316', '#64748b'];

const fmtM = (n: number) => `${(n / 1_000_000).toFixed(1)}M`;

export function RevenueChart({ data }: { data: { month: string; gmv: number; revenue: number; shipments: number }[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-bold text-ink">GMV & revenus (Ar)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={fmtM} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} Ar`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="gmv" name="GMV" fill="#1d3df5" radius={[4, 4, 0, 0]} />
          <Line dataKey="revenue" name="Commission" stroke="#ff9500" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VehicleChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-bold text-ink">Fret par type de véhicule</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 11 }}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
