'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setInfo('Akun berhasil dibuat. Silakan cek email untuk konfirmasi, lalu login.')
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        setError(error.message)
      } else {
        setInfo('Link reset password sudah dikirim ke email kamu. Cek inbox (atau folder spam) ya.')
      }
    }
    setLoading(false)
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--primary)' }}>
            Catatan Keuangan AI
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            Cukup chat, AI yang catat pengeluaranmu
          </p>
        </div>

        <div className="card p-6">
          {mode !== 'forgot' && (
            <div className="flex mb-6 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <button
                className={`flex-1 py-2 text-sm font-medium ${mode === 'login' ? 'text-white' : ''}`}
                style={{ background: mode === 'login' ? 'var(--primary)' : 'transparent' }}
                onClick={() => { setMode('login'); setError(null); setInfo(null) }}
                type="button"
              >
                Masuk
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${mode === 'signup' ? 'text-white' : ''}`}
                style={{ background: mode === 'signup' ? 'var(--primary)' : 'transparent' }}
                onClick={() => { setMode('signup'); setError(null); setInfo(null) }}
                type="button"
              >
                Daftar
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)' }}>
              Masukkan email akunmu, kami kirim link untuk atur ulang password.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                placeholder="kamu@email.com"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>
                  Password
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
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(null); setInfo(null) }}
                className="text-xs font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Lupa password?
              </button>
            )}

            {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
            {info && <p className="text-sm" style={{ color: 'var(--primary)' }}>{info}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-medium">
              {loading
                ? 'Memproses...'
                : mode === 'login'
                ? 'Masuk'
                : mode === 'signup'
                ? 'Buat akun'
                : 'Kirim link reset'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setInfo(null) }}
                className="text-xs font-medium w-full text-center"
                style={{ color: 'var(--ink-soft)' }}
              >
                ← Kembali ke halaman masuk
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
