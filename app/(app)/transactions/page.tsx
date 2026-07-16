import { createClient } from '@/lib/supabase/server'
import TransactionsTable from './table'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const params = await searchParams
  const now = new Date()
  const selectedYear = Number(params.year) || now.getFullYear()
  const selectedMonth = Number(params.month) || now.getMonth() + 1

  const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10)
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10)

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

  // Pilihan tahun: 4 tahun ke belakang sampai tahun sekarang
  const yearOptions = Array.from({ length: 5 }).map((_, i) => now.getFullYear() - i)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Riwayat pengeluaran</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Lihat transaksi per bulan, edit atau export ke Excel.
      </p>

      <TransactionsTable
        initialTransactions={transactions ?? []}
        categories={categories ?? []}
        monthNames={MONTH_NAMES}
        yearOptions={yearOptions}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />
    </div>
  )
}
