import { createClient } from '@/lib/supabase/server'
import TransactionsTable from './table'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, item, amount, date, category:categories(id, name, color)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, color').order('name'),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Riwayat pengeluaran</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Semua transaksi yang tercatat, bisa diedit atau di-export.
      </p>

      <TransactionsTable
        initialTransactions={transactions ?? []}
        categories={categories ?? []}
      />
    </div>
  )
}
