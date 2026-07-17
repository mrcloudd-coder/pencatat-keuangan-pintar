export type ParsedTransaction = {
  item: string
  kategori: string
  jumlah: number
}

// Gemini 3.1 Flash-Lite: model generasi terbaru (GA, bukan eksperimental),
// dioptimalkan khusus untuk task ekstraksi sederhana & volume tinggi dengan
// latensi serendah mungkin. Model generasi 2.5 sudah ditutup untuk API key baru,
// jadi kita pakai generasi 3.x yang memang jadi standar saat ini.
const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Status code yang menandakan API key sedang kena limit/kuota habis —
// kalau ketemu ini, sistem otomatis coba API key berikutnya di daftar.
const QUOTA_EXHAUSTED_STATUS = [429, 403]

/**
 * Ambil daftar API key dari environment variable.
 * Mendukung banyak key sekaligus, dipisah koma, contoh:
 *   GEMINI_API_KEYS="key_pertama,key_kedua,key_ketiga"
 * Tetap mendukung variabel lama GEMINI_API_KEY (1 key) untuk kompatibilitas.
 */
function getApiKeys(): string[] {
  const multiKeys = process.env.GEMINI_API_KEYS
  if (multiKeys && multiKeys.trim()) {
    return multiKeys
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  }
  const singleKey = process.env.GEMINI_API_KEY
  return singleKey ? [singleKey] : []
}

/**
 * Mengirim teks chat user ke Gemini dan meminta hasil parsing terstruktur
 * berupa daftar transaksi (item, kategori, jumlah). Kalau API key pertama
 * kena limit harian, otomatis dicoba lagi pakai API key berikutnya.
 */
export async function parseExpenseChat(
  chatText: string,
  existingCategories: string[]
): Promise<ParsedTransaction[]> {
  const apiKeys = getApiKeys()
  if (apiKeys.length === 0) {
    throw new Error('Belum ada GEMINI_API_KEY / GEMINI_API_KEYS di environment variables')
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

  async function callGemini(apiKey: string, withThinkingLevel: boolean) {
    const generationConfig: Record<string, unknown> = {
      temperature: 0.1,
      responseMimeType: 'application/json',
      maxOutputTokens: 500,
    }
    if (withThinkingLevel) {
      generationConfig.thinkingConfig = { thinkingLevel: 'low' }
    }

    // Batasi tiap percobaan maksimal 15 detik — kalau macet, gagal cepat
    // dan kasih pesan error, daripada user nunggu lama tanpa kepastian.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      return await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: chatText }] }],
          generationConfig,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  // Coba tiap API key secara berurutan. Kalau satu key kena limit/kuota habis,
  // otomatis lanjut ke key berikutnya tanpa user tahu/terganggu.
  let response: Response | null = null
  let lastError: Error | null = null

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i]
    try {
      let res = await callGemini(apiKey, true)
      // Fallback sekali kalau parameter thinkingConfig ditolak (model beda generasi)
      if (res.status === 400) {
        res = await callGemini(apiKey, false)
      }

      if (QUOTA_EXHAUSTED_STATUS.includes(res.status) && i < apiKeys.length - 1) {
        // Key ini lagi limit, coba key selanjutnya
        continue
      }

      response = res
      break
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error('AI terlalu lama merespons (lebih dari 15 detik). Coba lagi sebentar lagi.')
      } else {
        lastError = err instanceof Error ? err : new Error('Kesalahan tidak diketahui')
      }
      // Kalau masih ada key lain, coba lanjut; kalau ini key terakhir, lempar error di bawah
      if (i === apiKeys.length - 1) {
        throw lastError
      }
    }
  }

  if (!response) {
    throw lastError ?? new Error('Semua API key sedang kena limit. Coba lagi beberapa saat lagi.')
  }

  if (!response.ok) {
    const errText = await response.text()
    if (QUOTA_EXHAUSTED_STATUS.includes(response.status)) {
      throw new Error('Semua API key sedang kena limit harian. Coba lagi beberapa jam lagi, atau tambah API key baru.')
    }
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
