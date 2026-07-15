'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Send, Check, X, Pencil } from 'lucide-react'

type ParsedItem = {
  item: string
  kategori: string
  jumlah: number
}

type Category = { id: string; name: string }

export default function ChatPage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<ParsedItem[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('id, name').order('name')
      setCategories(data ?? [])
    }
    loadCategories()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setSavedMsg(null)
    setPending(null)

    try {
      const res = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses chat')
      if (!data.transactions?.length) {
        setError('AI tidak menemukan transaksi dari chat kamu. Coba lebih spesifik, misal: "jajan cilok 15k".')
      } else {
        setPending(data.transactions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  function updatePending(index: number, field: keyof ParsedItem, value: string | number) {
    if (!pending) return
    const copy = [...pending]
    copy[index] = { ...copy[index], [field]: value }
    setPending(copy)
  }

  function removePending(index: number) {
    if (!pending) return
    setPending(pending.filter((_, i) => i !== index))
  }

  async function confirmSave() {
    if (!pending || pending.length === 0) return
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

    // Untuk tiap transaksi: cari category_id yang cocok, atau buat kategori baru
    const rows = []
    let currentCategories = [...categories]

    for (const t of pending) {
      let cat = currentCategories.find((c) => c.name.toLowerCase() === t.kategori.toLowerCase())
      if (!cat) {
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert({ user_id: user.id, name: t.kategori })
          .select('id, name')
          .single()
        if (catErr || !newCat) {
          setError('Gagal membuat kategori baru: ' + (catErr?.message ?? ''))
          setSaving(false)
          return
        }
        cat = newCat
        currentCategories.push(newCat)
      }
      rows.push({
        user_id: user.id,
        item: t.item,
        category_id: cat.id,
        amount: t.jumlah,
      })
    }

    const { error: insertErr } = await supabase.from('transactions').insert(rows)
    if (insertErr) {
      setError('Gagal menyimpan transaksi: ' + insertErr.message)
      setSaving(false)
      return
    }

    setCategories(currentCategories)
    setSavedMsg(`${rows.length} transaksi berhasil disimpan.`)
    setPending(null)
    setText('')
    setSaving(false)
  }

  const total = pending?.reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0) ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Catat pengeluaran</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Ketik seperti biasa, AI yang urus sisanya. Contoh: &quot;jajan cilok 15k terus isi bensin 30k sama nonton bioskop 75k&quot;
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pengeluaranmu di sini..."
          className="flex-1 px-4 py-3 text-sm"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !text.trim()} className="btn-primary px-4 flex items-center justify-center">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {savedMsg && (
        <div className="card p-4 mb-4 text-sm" style={{ color: 'var(--primary)' }}>
          ✅ {savedMsg}
        </div>
      )}

      {pending && pending.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-sm">Konfirmasi transaksi</h2>
            <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>
              Cek dulu sebelum disimpan
            </span>
          </div>

          <div className="space-y-3">
            {pending.map((t, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                <Pencil size={14} style={{ color: 'var(--ink-soft)' }} />
                <input
                  value={t.item}
                  onChange={(e) => updatePending(i, 'item', e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm"
                />
                <input
                  value={t.kategori}
                  onChange={(e) => updatePending(i, 'kategori', e.target.value)}
                  list="category-list"
                  className="w-36 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={t.jumlah}
                  onChange={(e) => updatePending(i, 'jumlah', Number(e.target.value))}
                  className="w-28 px-2 py-1.5 text-sm"
                />
                <button onClick={() => removePending(i)} type="button" className="p-1.5" style={{ color: 'var(--danger)' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>

          <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-medium">
              Total: Rp{total.toLocaleString('id-ID')}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPending(null)} type="button" className="btn-secondary px-4 py-2 text-sm font-medium">
                Batal
              </button>
              <button onClick={confirmSave} disabled={saving} type="button" className="btn-primary px-4 py-2 text-sm font-medium flex items-center gap-1.5">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
