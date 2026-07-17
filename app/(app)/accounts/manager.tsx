'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Check, X, Wallet } from 'lucide-react'

type Account = { id: string; name: string; color: string; is_default: boolean }

const PRESET_COLORS = ['#0f6650', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#ef4444', '#22c55e', '#6b7280', '#d98c3f', '#14b8a6']

export default function AccountsManager({ accounts }: { accounts: Account[] }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Sesi login habis, silakan login ulang.')
      setSaving(false)
      return
    }

    const { error: insertErr } = await supabase.from('accounts').insert({
      user_id: user.id,
      name: name.trim(),
      color,
    })

    if (insertErr) {
      setError('Gagal menambah rekening: ' + insertErr.message)
      setSaving(false)
      return
    }

    setName('')
    setSaving(false)
    router.refresh()
  }

  function startEdit(acc: Account) {
    setEditingId(acc.id)
    setEditName(acc.name)
    setEditColor(acc.color)
  }

  async function saveEdit(id: string) {
    await supabase.from('accounts').update({ name: editName, color: editColor }).eq('id', id)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus rekening ini? Transaksi yang pakai rekening ini akan jadi "Tanpa rekening".')) return
    await supabase.from('accounts').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="card p-4 mb-6">
        <div className="flex gap-2 mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama rekening baru, misal: Rekening Jajan"
            className="flex-1 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm font-medium flex items-center gap-1.5">
            <Plus size={14} />
            Tambah
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full"
              style={{ background: c, outline: color === c ? '2px solid var(--ink)' : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>
        {error && <p className="text-sm mt-2" style={{ color: 'var(--danger)' }}>{error}</p>}
      </form>

      <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
        {accounts.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--ink-soft)' }}>
            Belum ada rekening
          </p>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-3 p-3" style={{ borderColor: 'var(--border)' }}>
              {editingId === acc.id ? (
                <>
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="w-5 h-5 rounded-full"
                        style={{ background: c, outline: editColor === c ? '2px solid var(--ink)' : 'none', outlineOffset: '2px' }}
                      />
                    ))}
                  </div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm"
                  />
                  <button onClick={() => saveEdit(acc.id)} style={{ color: 'var(--primary)' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ color: 'var(--ink-soft)' }}>
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: acc.color + '20', color: acc.color }}
                  >
                    <Wallet size={16} />
                  </span>
                  <span className="flex-1 text-sm">{acc.name}</span>
                  {acc.is_default && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                      Bawaan
                    </span>
                  )}
                  <button onClick={() => startEdit(acc)} style={{ color: 'var(--ink-soft)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
