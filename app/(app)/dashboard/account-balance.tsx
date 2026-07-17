'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Wallet } from 'lucide-react'

type AccountBalanceDatum = {
  id: string
  name: string
  color: string
  income: number
  expense: number
}

export default function AccountBalanceCharts({ data }: { data: AccountBalanceDatum[] }) {
  if (data.length === 0) return null

  return (
    <div className="card p-5">
      <h2 className="text-sm font-medium mb-3">Saldo per rekening</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((acc) => {
          const remaining = acc.income - acc.expense
          const pct = acc.income > 0 ? Math.min(100, Math.round((acc.expense / acc.income) * 100)) : 0
          const chartData =
            acc.income > 0
              ? [
                  { name: 'Terpakai', value: acc.expense },
                  { name: 'Sisa', value: Math.max(0, remaining) },
                ]
              : [{ name: 'Kosong', value: 1 }]

          return (
            <div key={acc.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
              <div className="relative w-16 h-16 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      innerRadius={20}
                      outerRadius={30}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {acc.income > 0 ? (
                        <>
                          <Cell fill={acc.color} />
                          <Cell fill="var(--border)" />
                        </>
                      ) : (
                        <Cell fill="var(--border)" />
                      )}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wallet size={16} style={{ color: acc.color }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{acc.name}</p>
                <p className="text-xs" style={{ color: remaining >= 0 ? 'var(--ink-soft)' : 'var(--danger)' }}>
                  Sisa Rp{remaining.toLocaleString('id-ID')}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                  {acc.income > 0 ? `${pct}% terpakai` : 'Belum ada pemasukan'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
