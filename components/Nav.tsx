'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Tag, List, LogOut, MessageCircleQuestion, Wallet } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/accounts', label: 'Rekening', icon: Wallet },
  { href: '/categories', label: 'Kategori', icon: Tag },
  { href: '/transactions', label: 'Riwayat', icon: List },
]

const TELEGRAM_CONTACT = 'https://t.me/mrclooudd'

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
        <div className="flex items-baseline gap-2">
          <span className="font-semibold" style={{ color: 'var(--primary)' }}>
            Catatan Keuangan AI
          </span>
          <span className="text-xs italic" style={{ color: 'var(--ink-soft)' }}>
            by cloud.studio
          </span>
        </div>
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

      {/* Floating contact button - laporan bug/kendala */}
      <a
        href={TELEGRAM_CONTACT}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 z-20 flex items-center justify-center w-12 h-12 rounded-full shadow-lg bottom-20 sm:bottom-6"
        style={{ background: 'var(--primary)', color: 'white' }}
        title="Ada kendala? Chat kami di Telegram"
      >
        <MessageCircleQuestion size={22} />
      </a>
    </>
  )
}
