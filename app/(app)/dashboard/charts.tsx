'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type CategoryDatum = { name: string; value: number; color: string }

export default function DashboardCharts({
  categoryData,
  totalIncome,
  totalExpense,
}: {
  categoryData: CategoryDatum[]
  totalIncome: number
  totalExpense: number
}) {
  const pct = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="card p-5">
        <h2 className="text-sm font-medium mb-3">Pemakaian budget</h2>
        <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: pct >= 90 ? 'var(--danger)' : 'var(--primary)',
            }}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
          {totalIncome > 0
            ? `${pct}% dari pemasukan sudah terpakai`
            : 'Tambahkan pemasukan untuk melihat progress budget'}
        </p>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium mb-2">Pengeluaran per kategori</h2>
        {categoryData.length === 0 ? (
          <p className="text-sm py-10 text-center" style={{ color: 'var(--ink-soft)' }}>
            Belum ada pengeluaran bulan ini
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `Rp${Number(value).toLocaleString('id-ID')}`} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {categoryData.map((c) => (
            <span key={c.name} className="text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
