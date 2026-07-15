import { createClient } from '@/lib/supabase/server'
import TransactionsTable from './table'
import AnnualCharts from './annual-charts'

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
  const yearStart = `${selectedYear}-01-01`
  const yearEnd = `${selectedYear}-12-31`

  const [{ data: transactions }, { data: yearTransactions }, { data: yearIncome }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, item, amount, date, category:categories(id, name, color)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('transactions').select('amount, date').eq('user_id', user.id).gte('date', yearStart).lte('date', yearEnd),
    supabase.from('income').select('amount, date').eq('user_id', user.id).gte('date', yearStart).lte('date', yearEnd),
  ])

  // Agregasi per bulan (index 0 = Januari) untuk chart tahunan
  const monthlyExpense = Array(12).fill(0)
  const monthlyIncome = Array(12).fill(0)
  for (const t of yearTransactions ?? []) {
    const m = new Date(t.date).getMonth()
    monthlyExpense[m] += Number(t.amount)
  }
  for (const i of yearIncome ?? []) {
    const m = new Date(i.date).getMonth()
    monthlyIncome[m] += Number(i.amount)
  }
  const chartData = MONTH_NAMES.map((name, i) => ({
    name: name.slice(0, 3),
    Pemasukan: monthlyIncome[i],
    Pengeluaran: monthlyExpense[i],
  }))

  // Pilihan tahun: 4 tahun ke belakang sampai tahun sekarang
  const yearOptions = Array.from({ length: 5 }).map((_, i) => now.getFullYear() - i)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Riwayat pengeluaran</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Lihat transaksi per bulan, edit atau export ke Excel.
      </p>

      <AnnualCharts data={chartData} year={selectedYear} />

      <div className="mt-6">
        <TransactionsTable
          initialTransactions={transactions ?? []}
          monthNames={MONTH_NAMES}
          yearOptions={yearOptions}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  )
}
