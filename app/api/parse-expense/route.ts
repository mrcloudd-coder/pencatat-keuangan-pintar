import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseExpenseChat } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 })
  }

  const { text } = await req.json()

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Chat tidak boleh kosong' }, { status: 400 })
  }

  // Ambil kategori yang sudah ada milik user, biar AI konsisten memakainya
  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', user.id)

  const categoryNames = (categories ?? []).map((c) => c.name)

  try {
    const results = await parseExpenseChat(text, categoryNames)
    return NextResponse.json({ transactions: results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat parsing'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
