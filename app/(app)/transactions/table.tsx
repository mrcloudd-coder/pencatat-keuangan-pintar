'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Download, Trash2, Plus } from 'lucide-react'

type Category = { id: string; name: string; color: string }
type Transaction = {
  id: string
  item: string
  amount: number
  date: string
  category: Category | Category[] | null
}

function getCategory(t: Transaction): Category | null {
  if (!t.category) return null
  return Array.isArray(t.category) ? t.category[0] ?? null : t.category
}

export default function TransactionsTable({
  initialTransactions,
  categories,
}: {
  initialTransactions: Transaction[]
  categories: Category[]
}) {
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    await supabase.from('transactions').delete().eq('id', id)
    router.refresh()
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('categories').insert({ user_id: user.id, name: newCategoryName.trim() })
    setNewCategoryName('')
    setShowNewCategory(false)
    router.refresh()
  }

  function handleExport() {
    const rows = initialTransactions.map((t) => ({
      Tanggal: t.date,
      Item: t.item,
      Kategori: getCategory(t)?.name ?? '-',
      Jumlah: t.amount,
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengeluaran')
    const filename = `pengeluaran_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <button onClick={() => setShowNewCategory(!showNewCategory)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 font-medium">
          <Plus size={14} />
          Kategori baru
        </button>
        <button onClick={handleExport} disabled={initialTransactions.length === 0} className="btn-primary text-xs px-3 py-2 flex items-center gap-1 font-medium">
          <Download size={14} />
          Export ke Excel
        </button>
      </div>

      {showNewCategory && (
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nama kategori baru"
            className="flex-1 px-3 py-2 text-sm"
          />
          <button type="submit" className="btn-primary px-4 py-2 text-sm font-medium">
            Tambah
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        {initialTransactions.length === 0 ? (
          <p className="text-sm py-12 text-center" style={{ color: 'var(--ink-soft)' }}>
            Belum ada transaksi. Yuk catat lewat menu &quot;Catat&quot;.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ background: 'var(--bg)' }}>
                <th className="px-4 py-3 font-medium" style={{ color: 'var(--ink-soft)' }}>Tanggal</th>
                <th className="px-4 py-3 font-medium" style={{ color: 'var(--ink-soft)' }}>Item</th>
                <th className="px-4 py-3 font-medium" style={{ color: 'var(--ink-soft)' }}>Kategori</th>
                <th className="px-4 py-3 font-medium text-right" style={{ color: 'var(--ink-soft)' }}>Jumlah</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {initialTransactions.map((t) => {
                const cat = getCategory(t)
                return (
                  <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">{t.item}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: (cat?.color ?? '#6b7280') + '20', color: cat?.color ?? '#6b7280' }}
                      >
                        {cat?.name ?? 'Lainnya'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">Rp{t.amount.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
