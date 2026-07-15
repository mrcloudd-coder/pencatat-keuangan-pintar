'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

type Category = { id: string; name: string; color: string; is_default: boolean }

const PRESET_COLORS = ['#0f6650', '#f97316', '#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#22c55e', '#6b7280', '#d98c3f', '#14b8a6']

export default function CategoriesManager({ categories }: { categories: Category[] }) {
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

    const { error: insertErr } = await supabase.from('categories').insert({
      user_id: user.id,
      name: name.trim(),
      color,
    })

    if (insertErr) {
      setError('Gagal menambah kategori: ' + insertErr.message)
      setSaving(false)
      return
    }

    setName('')
    setSaving(false)
    router.refresh()
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  async function saveEdit(id: string) {
    await supabase.from('categories').update({ name: editName, color: editColor }).eq('id', id)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kategori ini? Transaksi yang pakai kategori ini akan jadi "Lainnya".')) return
    await supabase.from('categories').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="card p-4 mb-6">
        <div className="flex gap-2 mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kategori baru, misal: Pendidikan"
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
        {categories.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--ink-soft)' }}>
            Belum ada kategori
          </p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-3" style={{ borderColor: 'var(--border)' }}>
              {editingId === cat.id ? (
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
                  <button onClick={() => saveEdit(cat.id)} style={{ color: 'var(--primary)' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ color: 'var(--ink-soft)' }}>
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="flex-1 text-sm">{cat.name}</span>
                  {cat.is_default && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                      Bawaan
                    </span>
                  )}
                  <button onClick={() => startEdit(cat)} style={{ color: 'var(--ink-soft)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} style={{ color: 'var(--danger)' }}>
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
