-- ================================================================
-- BizFlow — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ================================================================

-- Enable RLS
alter table if exists profiles enable row level security;

-- ── PROFILES ──────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  business_name text,
  owner_name text,
  phone text,
  whatsapp text,
  address text,
  city text,
  state text,
  pin text,
  niche text,
  gstin text,
  pan text,
  cin text,
  udyam_number text,
  bank_account text,
  ifsc text,
  bank_name text,
  lat float,
  lng float,
  plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── ORDERS ────────────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  product text,
  quantity float default 1,
  unit text default 'pcs',
  price float default 0,
  discount float default 0,
  total float default 0,
  status text default 'pending', -- pending | confirmed | delivered | cancelled
  notes text,
  invoice_number text,
  whatsapp_sent boolean default false,
  created_at timestamptz default now()
);

-- ── INVENTORY ─────────────────────────────────────────────────────
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  quantity float default 0,
  min_stock float default 5,
  max_stock float default 100,
  unit text default 'pcs',
  price float default 0,
  hsn text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── PAYMENTS ──────────────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  party_name text not null,
  party_phone text,
  type text default 'receivable', -- receivable | payable
  amount float default 0,
  due_date date,
  status text default 'pending', -- pending | paid | overdue
  reference text,
  notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz default now()
);

-- ── SUPPLIERS ─────────────────────────────────────────────────────
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  category text,
  gstin text,
  address text,
  outstanding float default 0,
  last_order_date date,
  rating float default 0,
  notes text,
  created_at timestamptz default now()
);

-- ── COMMUNITY POSTS ───────────────────────────────────────────────
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  post_type text default 'general', -- question | market_update | announcement | deal | general
  niche text,
  upvotes int default 0,
  created_at timestamptz default now()
);

-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Profiles: users can only see/edit their own
create policy "Users own their profile" on profiles
  for all using (auth.uid() = id);

-- Orders: users own their orders
alter table orders enable row level security;
create policy "Users own their orders" on orders
  for all using (auth.uid() = user_id);

-- Inventory: users own their inventory
alter table inventory enable row level security;
create policy "Users own their inventory" on inventory
  for all using (auth.uid() = user_id);

-- Payments: users own their payments
alter table payments enable row level security;
create policy "Users own their payments" on payments
  for all using (auth.uid() = user_id);

-- Suppliers: users own their suppliers
alter table suppliers enable row level security;
create policy "Users own their suppliers" on suppliers
  for all using (auth.uid() = user_id);

-- Community: anyone can read, authenticated users can post
alter table community_posts enable row level security;
create policy "Anyone can read posts" on community_posts
  for select using (true);
create policy "Authenticated users can post" on community_posts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on community_posts
  for update using (auth.uid() = user_id);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_inventory_user on inventory(user_id);
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_payments_due on payments(due_date);
create index if not exists idx_suppliers_user on suppliers(user_id);
create index if not exists idx_community_niche on community_posts(niche);
create index if not exists idx_community_created on community_posts(created_at desc);
