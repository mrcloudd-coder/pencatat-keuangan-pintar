'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

type IncomeRow = { id: string; amount: number; source: string; date: string; account_id: string | null }
type Account = { id: string; name: string; color: string }

export default function IncomeManager({
  incomeList,
  accounts,
}: {
  incomeList: IncomeRow[]
  accounts: Account[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editAccountId, setEditAccountId] = useState('')
  const supabase = createClient()
  const router = useRouter()

  function accountName(id: string | null) {
    return accounts.find((a) => a.id === id)?.name ?? 'Tanpa rekening'
  }
  function accountColor(id: string | null) {
    return accounts.find((a) => a.id === id)?.color ?? '#6b7280'
  }

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !accountId) return
    setSaving(true)
    setError(null)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertErr } = await supabase.from('income').insert({
      user_id: user.id,
      amount: Number(amount),
      source: source || 'Pemasukan',
      account_id: accountId,
    })

    setSaving(false)
    if (insertErr) {
      setError('Gagal menyimpan: ' + insertErr.message)
      return
    }
    setShowForm(false)
    setAmount('')
    setSource('')
    router.refresh()
  }

  function startEdit(row: IncomeRow) {
    setEditingId(row.id)
    setEditAmount(String(row.amount))
    setEditSource(row.source)
    setEditAccountId(row.account_id ?? accounts[0]?.id ?? '')
  }

  async function saveEdit(id: string) {
    await supabase
      .from('income')
      .update({ amount: Number(editAmount), source: editSource, account_id: editAccountId || null })
      .eq('id', id)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pemasukan ini?')) return
    await supabase.from('income').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Pemasukan bulan ini</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 font-medium"
        >
          <Plus size={14} />
          Tambah
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddIncome} className="flex flex-col gap-2 mb-3 p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="px-3 py-2 text-sm"
          >
            <option value="" disabled>Masuk ke rekening...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
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
          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" disabled={saving || !accountId} className="btn-primary py-2 text-sm font-medium">
            {saving ? 'Menyimpan...' : 'Simpan pemasukan'}
          </button>
        </form>
      )}

      {incomeList.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--ink-soft)' }}>
          Belum ada pemasukan bulan ini
        </p>
      ) : (
        <div className="space-y-2">
          {incomeList.map((row) => (
            <div key={row.id} className="flex items-center gap-2 p-2.5 rounded-lg text-sm" style={{ background: 'var(--bg)' }}>
              {editingId === row.id ? (
                <>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    className="w-28 px-2 py-1.5 text-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm"
                  />
                  <input
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-24 px-2 py-1.5 text-sm"
                  />
                  <button onClick={() => saveEdit(row.id)} style={{ color: 'var(--primary)' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ color: 'var(--ink-soft)' }}>
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
                    style={{ background: accountColor(row.account_id) + '20', color: accountColor(row.account_id) }}
                  >
                    {accountName(row.account_id)}
                  </span>
                  <span className="flex-1">Rp{row.amount.toLocaleString('id-ID')}</span>
                  <span style={{ color: 'var(--ink-soft)' }}>{row.source}</span>
                  <button onClick={() => startEdit(row)} style={{ color: 'var(--ink-soft)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(row.id)} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
