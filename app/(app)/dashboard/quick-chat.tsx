'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Check, X, Pencil } from 'lucide-react'

type ParsedItem = { item: string; kategori: string; jumlah: number }
type Category = { id: string; name: string }

export default function QuickChat({ categories: initialCategories }: { categories: Category[] }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<ParsedItem[] | null>(null)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

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

    const rows = []
    const currentCategories = [...categories]

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
      rows.push({ user_id: user.id, item: t.item, category_id: cat.id, amount: t.jumlah })
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
    router.refresh()
  }

  const total = pending?.reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0) ?? 0

  return (
    <div className="card p-5">
      <h2 className="text-sm font-medium mb-1">Catat pengeluaran</h2>
      <p className="text-xs mb-3" style={{ color: 'var(--ink-soft)' }}>
        Contoh: &quot;jajan cilok 15k terus isi bensin 30k&quot;
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pengeluaranmu..."
          className="flex-1 px-3 py-2 text-sm"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !text.trim()} className="btn-primary px-3 flex items-center justify-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {error && (
        <div className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {savedMsg && (
        <div className="text-sm mb-3" style={{ color: 'var(--primary)' }}>
          ✅ {savedMsg}
        </div>
      )}

      {pending && pending.length > 0 && (
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
          <div className="space-y-2 mb-3">
            {pending.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Pencil size={12} style={{ color: 'var(--ink-soft)' }} />
                <input
                  value={t.item}
                  onChange={(e) => updatePending(i, 'item', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs"
                />
                <input
                  value={t.kategori}
                  onChange={(e) => updatePending(i, 'kategori', e.target.value)}
                  list="quick-category-list"
                  className="w-24 px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  value={t.jumlah}
                  onChange={(e) => updatePending(i, 'jumlah', Number(e.target.value))}
                  className="w-20 px-2 py-1 text-xs"
                />
                <button onClick={() => removePending(i)} type="button" style={{ color: 'var(--danger)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <datalist id="quick-category-list">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-medium">Total: Rp{total.toLocaleString('id-ID')}</span>
            <div className="flex gap-2">
              <button onClick={() => setPending(null)} type="button" className="btn-secondary px-3 py-1.5 text-xs font-medium">
                Batal
              </button>
              <button onClick={confirmSave} disabled={saving} type="button" className="btn-primary px-3 py-1.5 text-xs font-medium flex items-center gap-1">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
