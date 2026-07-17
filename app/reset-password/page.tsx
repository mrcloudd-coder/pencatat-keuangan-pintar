'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setDone(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1500)
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--primary)' }}>
            Atur password baru
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            Masukkan password baru untuk akunmu.
          </p>
        </div>

        <div className="card p-6">
          {done ? (
            <p className="text-sm text-center" style={{ color: 'var(--primary)' }}>
              ✅ Password berhasil diubah. Mengarahkan ke dashboard...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>
                  Password baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>
                  Konfirmasi password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  placeholder="Ulangi password baru"
                />
              </div>

              {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-medium">
                {loading ? 'Menyimpan...' : 'Simpan password baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
