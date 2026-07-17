'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Download, Trash2, Pencil, Check, X } from 'lucide-react'

type Category = { id: string; name: string; color: string }
type Account = { id: string; name: string; color: string }
type Transaction = {
  id: string
  item: string
  amount: number
  date: string
  category: Category | Category[] | null
  account: Account | Account[] | null
}

function getCategory(t: Transaction): Category | null {
  if (!t.category) return null
  return Array.isArray(t.category) ? t.category[0] ?? null : t.category
}
function getAccount(t: Transaction): Account | null {
  if (!t.account) return null
  return Array.isArray(t.account) ? t.account[0] ?? null : t.account
}

export default function TransactionsTable({
  initialTransactions,
  categories,
  accounts,
  monthNames,
  yearOptions,
  selectedYear,
  selectedMonth,
}: {
  initialTransactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  monthNames: string[]
  yearOptions: number[]
  selectedYear: number
  selectedMonth: number
}) {
  const supabase = createClient()
  const router = useRouter()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editAccountId, setEditAccountId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    await supabase.from('transactions').delete().eq('id', id)
    router.refresh()
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id)
    setEditItem(t.item)
    setEditAmount(String(t.amount))
    setEditCategoryId(getCategory(t)?.id ?? '')
    setEditAccountId(getAccount(t)?.id ?? '')
    setEditDate(t.date)
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
  }

  async function saveEdit(id: string) {
    if (!editItem.trim() || !editAmount) return
    setSaving(true)
    setError(null)
    const { error: updateErr } = await supabase
      .from('transactions')
      .update({
        item: editItem.trim(),
        amount: Number(editAmount),
        category_id: editCategoryId || null,
        account_id: editAccountId || null,
        date: editDate,
      })
      .eq('id', id)

    setSaving(false)
    if (updateErr) {
      setError('Gagal menyimpan perubahan: ' + updateErr.message)
      return
    }
    setEditingId(null)
    router.refresh()
  }

  function updateFilter(year: number, month: number) {
    router.push(`/transactions?year=${year}&month=${month}`)
  }

  const total = initialTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

  function handleExport() {
    const rows = initialTransactions.map((t) => ({
      Tanggal: t.date,
      Item: t.item,
      Kategori: getCategory(t)?.name ?? '-',
      Rekening: getAccount(t)?.name ?? '-',
      Jumlah: t.amount,
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengeluaran')
    XLSX.writeFile(workbook, `pengeluaran_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => updateFilter(selectedYear, Number(e.target.value))}
            className="px-3 py-2 text-sm"
          >
            {monthNames.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => updateFilter(Number(e.target.value), selectedMonth)}
            className="px-3 py-2 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleExport} disabled={initialTransactions.length === 0} className="btn-primary text-xs px-3 py-2 flex items-center gap-1 font-medium">
          <Download size={14} />
          Export ke Excel
        </button>
      </div>

      {error && (
        <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <div className="card overflow-hidden mb-3">
        {initialTransactions.length === 0 ? (
          <p className="text-sm py-12 text-center" style={{ color: 'var(--ink-soft)' }}>
            Belum ada transaksi di bulan ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left" style={{ background: 'var(--bg)' }}>
                <th className="px-4 py-3 font-medium" style={{ color: 'var(--ink-soft)' }}>Tanggal</th>
                <th className="px-4 py-3 font-medium" style={{ color: 'var(--ink-soft)' }}>Item</th>
                <th className="px-4 py-3 font-medium" style={{ color: 'var(--ink-soft)' }}>Kategori</th>
                <th className="px-4 py-3 font-medium" style={{ color: 'var(--ink-soft)' }}>Rekening</th>
                <th className="px-4 py-3 font-medium text-right" style={{ color: 'var(--ink-soft)' }}>Jumlah</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {initialTransactions.map((t) => {
                const cat = getCategory(t)
                const acc = getAccount(t)
                const isEditing = editingId === t.id

                if (isEditing) {
                  return (
                    <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={editItem}
                          onChange={(e) => setEditItem(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs"
                        >
                          <option value="">Lainnya</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={editAccountId}
                          onChange={(e) => setEditAccountId(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs"
                        >
                          <option value="">Tanpa rekening</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-right"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(t.id)} disabled={saving} style={{ color: 'var(--primary)' }}>
                            <Check size={16} />
                          </button>
                          <button onClick={cancelEdit} style={{ color: 'var(--ink-soft)' }}>
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.item}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: (cat?.color ?? '#6b7280') + '20', color: cat?.color ?? '#6b7280' }}
                      >
                        {cat?.name ?? 'Lainnya'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: (acc?.color ?? '#6b7280') + '20', color: acc?.color ?? '#6b7280' }}
                      >
                        {acc?.name ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">Rp{t.amount.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => startEdit(t)} style={{ color: 'var(--ink-soft)' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {initialTransactions.length > 0 && (
        <p className="text-sm text-right font-medium">
          Total bulan ini: Rp{total.toLocaleString('id-ID')}
        </p>
      )}
    </div>
  )
}
