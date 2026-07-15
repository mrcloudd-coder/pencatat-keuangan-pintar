'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Tag, List, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/categories', label: 'Kategori', icon: Tag },
  { href: '/transactions', label: 'Riwayat', icon: List },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top bar - desktop */}
      <header className="hidden sm:flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="font-semibold" style={{ color: 'var(--primary)' }}>
          Catatan Keuangan AI
        </span>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                background: pathname === href ? 'var(--primary-soft)' : 'transparent',
                color: pathname === href ? 'var(--primary)' : 'var(--ink-soft)',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ml-2"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </nav>
      </header>

      {/* Bottom nav - mobile */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 border-t z-10"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs"
            style={{ color: pathname === href ? 'var(--primary)' : 'var(--ink-soft)' }}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs" style={{ color: 'var(--danger)' }}>
          <LogOut size={20} />
          Keluar
        </button>
      </nav>
    </>
  )
}
