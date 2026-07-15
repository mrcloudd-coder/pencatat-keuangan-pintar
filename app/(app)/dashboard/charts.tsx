'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

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
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const pct = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault()
    if (!amount) return
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('income').insert({
      user_id: user.id,
      amount: Number(amount),
      source: source || 'Pemasukan',
    })

    setSaving(false)
    setShowForm(false)
    setAmount('')
    setSource('')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Pemakaian budget</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 font-medium"
          >
            <Plus size={14} />
            Tambah pemasukan
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddIncome} className="flex flex-col gap-2 mb-4 p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
            <input
              type="number"
              placeholder="Jumlah (contoh: 1500000)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="px-3 py-2 text-sm"
            />
            <input
              placeholder="Sumber (opsional, misal: Gaji)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-3 py-2 text-sm"
            />
            <button type="submit" disabled={saving} className="btn-primary py-2 text-sm font-medium">
              {saving ? 'Menyimpan...' : 'Simpan pemasukan'}
            </button>
          </form>
        )}

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
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
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
