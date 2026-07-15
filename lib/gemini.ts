export type ParsedTransaction = {
  item: string
  kategori: string
  jumlah: number
}

// Pakai alias "latest" supaya otomatis ikut model flash terbaru yang stabil,
// jadi nggak perlu update kode manual tiap kali Google deprecate versi lama.
const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/**
 * Mengirim teks chat user ke Gemini dan meminta hasil parsing terstruktur
 * berupa daftar transaksi (item, kategori, jumlah).
 */
export async function parseExpenseChat(
  chatText: string,
  existingCategories: string[]
): Promise<ParsedTransaction[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum di-set di environment variables')
  }

  const systemPrompt = `Kamu adalah asisten pencatat keuangan. Tugasmu adalah membaca chat berbahasa Indonesia (termasuk bahasa gaul/sehari-hari) dari user tentang pengeluaran mereka, lalu mengubahnya menjadi daftar transaksi terstruktur dalam format JSON.

ATURAN:
1. Setiap transaksi harus punya: "item" (nama barang/jasa), "kategori", dan "jumlah" (angka, dalam Rupiah, tanpa titik/koma/simbol).
2. Konversi singkatan angka: "15k" / "15rb" / "15ribu" = 15000. "1.5jt" / "1,5jt" = 1500000.
3. Gunakan salah satu kategori berikut jika cocok: ${existingCategories.join(', ')}. Jika tidak ada yang cocok, buat kategori baru yang singkat dan relevan.
4. Satu kalimat bisa mengandung lebih dari satu transaksi — pisahkan masing-masing.
5. Abaikan kata yang bukan transaksi (contoh: "terus", "sama", "abis itu").
6. HANYA balas dengan JSON array yang valid, tanpa teks lain, tanpa markdown code block, tanpa penjelasan.

Format output:
[{"item": "...", "kategori": "...", "jumlah": 0}]`

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: chatText }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error('Gemini tidak mengembalikan hasil parsing yang valid')
  }

  const cleaned = rawText.replace(/```json|```/g, '').trim()

  let parsed: ParsedTransaction[]
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Gagal membaca hasil parsing AI. Coba ketik ulang dengan lebih jelas.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Format hasil parsing tidak sesuai')
  }

  return parsed.filter(
    (t) => t.item && t.kategori && typeof t.jumlah === 'number' && t.jumlah > 0
  )
}
