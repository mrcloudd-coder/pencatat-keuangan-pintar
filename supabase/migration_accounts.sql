-- ============================================
-- MIGRATION: Tambah fitur Rekening/Akun
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- (Aman dijalankan meski sudah ada data lama)
-- ============================================

-- 1. Tabel rekening/akun
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#0f6650',
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table accounts enable row level security;

create policy "Users can view own accounts" on accounts
  for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on accounts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on accounts
  for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on accounts
  for delete using (auth.uid() = user_id);

-- 2. Tambah kolom account_id ke tabel income & transactions
alter table income add column if not exists account_id uuid references accounts(id) on delete set null;
alter table transactions add column if not exists account_id uuid references accounts(id) on delete set null;

-- 3. Update function agar user baru otomatis dapat 2 rekening default
--    (menggabungkan dengan pembuatan kategori default yang sudah ada)
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

  insert into public.accounts (user_id, name, color, is_default) values
    (new.id, 'Kas/Tunai', '#0f6650', true),
    (new.id, 'Rekening Utama', '#3b82f6', true);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Untuk user yang SUDAH ada sebelum migration ini (trigger di atas cuma
--    berlaku untuk user baru), buatkan 2 rekening default untuk mereka juga.
--    Aman dijalankan berulang, tidak akan duplikat.
insert into accounts (user_id, name, color, is_default)
select u.id, 'Kas/Tunai', '#0f6650', true
from auth.users u
where not exists (
  select 1 from accounts a where a.user_id = u.id
);

insert into accounts (user_id, name, color, is_default)
select u.id, 'Rekening Utama', '#3b82f6', true
from auth.users u
where not exists (
  select 1 from accounts a where a.user_id = u.id and a.name = 'Rekening Utama'
);
