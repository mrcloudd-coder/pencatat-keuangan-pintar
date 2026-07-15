# Catatan Keuangan AI

Web app pencatat keuangan — user tinggal chat pengeluarannya, AI (Gemini) yang otomatis
mem-parsing jadi transaksi terstruktur dan menyimpannya ke database.

## Fitur
- Input pemasukan
- Chat bebas untuk catat pengeluaran → AI parsing otomatis (multi-transaksi sekaligus)
- Konfirmasi/edit hasil parsing sebelum disimpan
- Dashboard ringkasan (pemasukan vs pengeluaran vs sisa saldo) + pie chart per kategori
- Kategori custom
- Export riwayat pengeluaran ke Excel (.xlsx)

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (database + auth)
- Gemini API (`gemini-2.5-flash`) untuk parsing chat
- Recharts (chart), SheetJS/xlsx (export Excel)

---

## Cara Deploy (langkah demi langkah)

### 1. Setup database Supabase
1. Buka project Supabase kamu -> menu **SQL Editor**
2. Copy seluruh isi file `supabase/schema.sql` di folder ini
3. Paste ke SQL Editor, klik **Run**
4. Ini akan membuat tabel `categories`, `income`, `transactions`, mengaktifkan Row Level
   Security (supaya data tiap user terisolasi), dan membuat kategori default otomatis
   untuk user baru.

### 2. Push kode ke GitHub
```bash
cd finance-app
git init
git add .
git commit -m "Initial commit"
```
Lalu buat repo baru di GitHub (kosongan, tanpa README), dan jalankan perintah yang
diberikan GitHub untuk push repo lokal ke sana (`git remote add origin ...` lalu
`git push -u origin main`).

### 3. Deploy ke Vercel
1. Buka vercel.com/new
2. Import repo GitHub yang baru kamu push
3. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan 3 ini:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase (Settings -> API) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key dari Supabase |
   | `GEMINI_API_KEY` | API key dari Google AI Studio |

4. Klik **Deploy**, tunggu 1-2 menit
5. Selesai -- kamu akan dapat link seperti `nama-project.vercel.app`. Ini yang bisa
   langsung dikirim ke customer.

### 4. Testing lokal (opsional, sebelum deploy)
```bash
npm install
cp .env.local.example .env.local   # lalu isi dengan value asli kamu
npm run dev
```
Buka `http://localhost:3000`.

---

## Struktur folder penting
```
app/
  login/               -> halaman login & daftar
  (app)/dashboard/     -> ringkasan + chart
  (app)/chat/          -> input chat + konfirmasi AI parsing
  (app)/transactions/  -> tabel riwayat + export Excel
  api/parse-expense/   -> API route yang panggil Gemini
lib/
  gemini.ts            -> logic parsing AI
  supabase/             -> koneksi ke Supabase (client, server, middleware)
supabase/
  schema.sql            -> SQL untuk setup database
```

## Catatan
- Model Gemini yang dipakai: `gemini-2.5-flash` (masih di free tier, hemat, cukup akurat
  untuk task extraction). Bisa diganti di `lib/gemini.ts` kalau nanti mau upgrade model.
- Free tier Gemini ada limit rate (request per menit/hari) -- cukup untuk testing dan
  early users, tapi kalau user sudah banyak, perlu upgrade ke paid tier.
- Jangan commit file `.env.local` ke git (sudah otomatis di-ignore lewat `.gitignore`).
