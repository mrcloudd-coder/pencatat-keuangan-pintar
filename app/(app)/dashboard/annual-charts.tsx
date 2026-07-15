'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

type MonthDatum = { name: string; Pemasukan: number; Pengeluaran: number }

function formatShort(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`
  return String(value)
}

export default function AnnualCharts({ data, year }: { data: MonthDatum[]; year: number }) {
  const hasData = data.some((d) => d.Pemasukan > 0 || d.Pengeluaran > 0)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">Tren pemasukan vs pengeluaran {year}</h2>
      </div>

      {!hasData ? (
        <p className="text-sm py-10 text-center" style={{ color: 'var(--ink-soft)' }}>
          Belum ada data di tahun {year}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatShort} tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} width={45} />
            <Tooltip
              formatter={(value) => `Rp${Number(value).toLocaleString('id-ID')}`}
              contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Pemasukan" fill="#0f6650" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="Pengeluaran" fill="#d98c3f" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
