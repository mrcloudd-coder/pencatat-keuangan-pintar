import { createClient } from '@/lib/supabase/server'
import CategoriesManager from './manager'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color, is_default')
    .order('name')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Kategori</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Kelola kategori pengeluaranmu. Kategori bawaan sudah disiapkan, kamu bisa tambah sendiri.
      </p>

      <CategoriesManager categories={categories ?? []} />
    </div>
  )
}
