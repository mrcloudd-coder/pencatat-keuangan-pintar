import { createClient } from '@/lib/supabase/server'
import DashboardCharts from './charts'
import IncomeManager from './income-manager'
import QuickChat from './quick-chat'
import AnnualCharts from './annual-charts'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const yearStart = `${now.getFullYear()}-01-01`
  const yearEnd = `${now.getFullYear()}-12-31`

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]

  const [{ data: income }, { data: transactions }, { data: categories }, { data: yearTransactions }, { data: yearIncome }] = await Promise.all([
    supabase.from('income').select('id, amount, source, date').eq('user_id', user.id).gte('date', startOfMonth).order('date', { ascending: false }),
    supabase
      .from('transactions')
      .select('id, item, amount, date, category:categories(name, color)')
      .eq('user_id', user.id)
      .gte('date', startOfMonth)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('transactions').select('amount, date').eq('user_id', user.id).gte('date', yearStart).lte('date', yearEnd),
    supabase.from('income').select('amount, date').eq('user_id', user.id).gte('date', yearStart).lte('date', yearEnd),
  ])

  const monthlyExpense = Array(12).fill(0)
  const monthlyIncome = Array(12).fill(0)
  for (const t of yearTransactions ?? []) {
    monthlyExpense[new Date(t.date).getMonth()] += Number(t.amount)
  }
  for (const i of yearIncome ?? []) {
    monthlyIncome[new Date(i.date).getMonth()] += Number(i.amount)
  }
  const annualChartData = MONTH_NAMES.map((name, i) => ({
    name: name.slice(0, 3),
    Pemasukan: monthlyIncome[i],
    Pengeluaran: monthlyExpense[i],
  }))

  const totalIncome = (income ?? []).reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpense = (transactions ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
  const remaining = totalIncome - totalExpense

  const byCategory: Record<string, { name: string; value: number; color: string }> = {}
  for (const t of transactions ?? []) {
    const cat = Array.isArray(t.category) ? t.category[0] : t.category
    const name = cat?.name ?? 'Lainnya'
    const color = cat?.color ?? '#6b7280'
    if (!byCategory[name]) byCategory[name] = { name, value: 0, color }
    byCategory[name].value += Number(t.amount)
  }

  const previewRows = (transactions ?? []).slice(0, 15)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Beranda</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs mb-1" style={{ color: 'var(--ink-soft)' }}>Pemasukan</p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--primary)' }}>
            Rp{totalIncome.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs mb-1" style={{ color: 'var(--ink-soft)' }}>Pengeluaran</p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>
            Rp{totalExpense.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs mb-1" style={{ color: 'var(--ink-soft)' }}>Sisa saldo</p>
          <p className="text-2xl font-semibold" style={{ color: remaining >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
            Rp{remaining.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <QuickChat categories={categories ?? []} />
        <div className="card p-5">
          <IncomeManager incomeList={income ?? []} />
        </div>
      </div>

      <div className="mb-6">
        <DashboardCharts
          categoryData={Object.values(byCategory)}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
        />
      </div>

      <div className="mb-6">
        <AnnualCharts data={annualChartData} year={now.getFullYear()} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Transaksi terbaru</h2>
          <Link href="/transactions" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
            Lihat semua riwayat →
          </Link>
        </div>
        {previewRows.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--ink-soft)' }}>
            Belum ada transaksi bulan ini
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ background: 'var(--bg)' }}>
                  <th className="px-3 py-2 font-medium text-xs" style={{ color: 'var(--ink-soft)' }}>Tanggal</th>
                  <th className="px-3 py-2 font-medium text-xs" style={{ color: 'var(--ink-soft)' }}>Item</th>
                  <th className="px-3 py-2 font-medium text-xs" style={{ color: 'var(--ink-soft)' }}>Kategori</th>
                  <th className="px-3 py-2 font-medium text-xs text-right" style={{ color: 'var(--ink-soft)' }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((t) => {
                  const cat = Array.isArray(t.category) ? t.category[0] : t.category
                  return (
                    <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-3 py-2 text-xs">{t.item}</td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ background: (cat?.color ?? '#6b7280') + '20', color: cat?.color ?? '#6b7280' }}
                        >
                          {cat?.name ?? 'Lainnya'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-right whitespace-nowrap">Rp{Number(t.amount).toLocaleString('id-ID')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
