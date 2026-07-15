import { createClient } from '@/lib/supabase/server'
import DashboardCharts from './charts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const [{ data: income }, { data: transactions }] = await Promise.all([
    supabase.from('income').select('amount, date').eq('user_id', user.id).gte('date', startOfMonth),
    supabase
      .from('transactions')
      .select('id, item, amount, date, category:categories(name, color)')
      .eq('user_id', user.id)
      .gte('date', startOfMonth)
      .order('date', { ascending: false }),
  ])

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Ringkasan bulan ini</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      <DashboardCharts
        categoryData={Object.values(byCategory)}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />
    </div>
  )
}
