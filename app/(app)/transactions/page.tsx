import { createClient } from '@/lib/supabase/server'
import TransactionsTable from './table'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const params = await searchParams
  const now = new Date()
  const selectedMonth = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = selectedMonth.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10)

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, item, amount, date, category:categories(id, name, color)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, color').order('name'),
  ])

  // Generate 12 bulan terakhir untuk pilihan dropdown
  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Riwayat pengeluaran</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Lihat transaksi per bulan, edit atau export ke Excel.
      </p>

      <TransactionsTable
        initialTransactions={transactions ?? []}
        categories={categories ?? []}
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
      />
    </div>
  )
}
