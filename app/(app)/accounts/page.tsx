import { createClient } from '@/lib/supabase/server'
import AccountsManager from './manager'

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, color, is_default')
    .order('name')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Rekening</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Kelola rekening/dompet kamu. Pemasukan dan pengeluaran bisa ditandai masuk/keluar dari rekening mana.
      </p>

      <AccountsManager accounts={accounts ?? []} />
    </div>
  )
}
