-- ============================================
-- SCHEMA: Catatan Keuangan AI
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Tabel kategori (user bisa punya kategori custom)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 2. Tabel pemasukan
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  source text default 'Pemasukan',
  date date not null default current_date,
  created_at timestamptz default now()
);

-- 3. Tabel transaksi (pengeluaran)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null,
  category_id uuid references categories(id) on delete set null,
  amount numeric not null check (amount >= 0),
  date date not null default current_date,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Wajib diaktifkan supaya user cuma bisa akses data miliknya sendiri
-- ============================================

alter table categories enable row level security;
alter table income enable row level security;
alter table transactions enable row level security;

-- Policy: categories
create policy "Users can view own categories" on categories
  for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on categories
  for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on categories
  for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on categories
  for delete using (auth.uid() = user_id);

-- Policy: income
create policy "Users can view own income" on income
  for select using (auth.uid() = user_id);
create policy "Users can insert own income" on income
  for insert with check (auth.uid() = user_id);
create policy "Users can update own income" on income
  for update using (auth.uid() = user_id);
create policy "Users can delete own income" on income
  for delete using (auth.uid() = user_id);

-- Policy: transactions
create policy "Users can view own transactions" on transactions
  for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions
  for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions
  for delete using (auth.uid() = user_id);

-- ============================================
-- FUNCTION: otomatis bikin kategori default untuk user baru
-- ============================================
create or replace function create_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, color, is_default) values
    (new.id, 'Makanan & Minuman', '#f97316', true),
    (new.id, 'Transportasi', '#3b82f6', true),
    (new.id, 'Hiburan', '#a855f7', true),
    (new.id, 'Belanja', '#ec4899', true),
    (new.id, 'Tagihan', '#ef4444', true),
    (new.id, 'Kesehatan', '#22c55e', true),
    (new.id, 'Lainnya', '#6b7280', true);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_default_categories();
