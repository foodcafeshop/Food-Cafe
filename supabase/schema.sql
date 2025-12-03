-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 0. Shops (Multi-Tenancy Root)
create table public.shops (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  address text,
  location_url text,
  shop_type text,
  gstin text,
  fssai_license text,
  contact_phone text,
  contact_email text,
  owner_name text,
  logo_url text,
  cover_image text,
  opening_hours jsonb,
  social_links jsonb,
  average_rating numeric(3, 1) default 0,
  rating_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Menus
create table public.menus (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id),
  name text not null,
  description text,
  is_active boolean default false,
  images text[] default array[]::text[],
  tags text[] default array[]::text[],
  dietary_type text check (dietary_type in ('all', 'veg', 'non_veg', 'vegan')) default 'all',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories (Global Sections)
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id),
  name text not null,
  image text,
  tags text[] default array[]::text[],
  dietary_type text check (dietary_type in ('all', 'veg', 'non_veg', 'vegan')) default 'all',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Menu Categories (Junction: Menu <-> Category)
create table public.menu_categories (
  menu_id uuid references public.menus(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  sort_order integer default 0,
  primary key (menu_id, category_id)
);

-- 4. Menu Items (Global Library)
create table public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id),
  name text not null,
  description text,
  price decimal(10, 2) not null,
  original_price decimal(10, 2),
  images text[] default array[]::text[],
  dietary_type text check (dietary_type in ('veg', 'non_veg', 'vegan')) default 'veg',
  tags text[] default array[]::text[],
  is_available boolean default true,
  is_popular boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Category Items (Junction: Category <-> Item)
create table public.category_items (
  category_id uuid references public.categories(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete cascade,
  sort_order integer default 0,
  primary key (category_id, menu_item_id)
);

-- 6. Tables
create table public.tables (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id),
  label text not null unique,
  seats integer default 2,
  x integer default 0,
  y integer default 0,
  status text check (status in ('empty', 'occupied', 'billed')) default 'empty',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Orders
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id),
  table_id uuid references public.tables(id) on delete set null,
  order_number text,
  status text check (status in ('queued', 'preparing', 'ready', 'served', 'cancelled', 'billed')) default 'queued',
  total_amount decimal(10, 2) not null default 0,
  payment_status text check (payment_status in ('pending', 'paid')) default 'pending',
  payment_method text,
  customer_name text,
  customer_phone text,
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ready_at timestamp with time zone,
  served_at timestamp with time zone
);

-- 8. Order Items
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price decimal(10, 2) not null,
  quantity integer not null default 1,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Settings
create table public.settings (
  id integer primary key check (id = 1),
  shop_id uuid references public.shops(id),
  restaurant_name text default 'Food Cafe Premium',
  currency text default 'USD',
  language text default 'en',
  tax_rate decimal(5, 2) default 10.00,
  service_charge decimal(5, 2) default 5.00,
  dark_mode boolean default false,
  sound_notifications boolean default true,
  auto_print boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.settings (id) values (1) on conflict do nothing;

-- 10. Bills
create table if not exists public.bills (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id),
  table_id uuid references public.tables(id),
  bill_number text not null,
  total_amount numeric not null,
  payment_method text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_ids uuid[] not null,
  items_snapshot jsonb not null
);

-- Indexes
create index idx_orders_created_at on public.orders(created_at);
create index idx_orders_status on public.orders(status);
create index idx_menu_categories_menu_id on public.menu_categories(menu_id);
create index idx_category_items_cat_id on public.category_items(category_id);

-- Multi-Tenancy Indexes
create unique index idx_orders_shop_number_date on public.orders (shop_id, order_number, ((created_at at time zone 'UTC')::date));
create unique index idx_bills_bill_number on public.bills(bill_number);
create index idx_menus_shop_id on public.menus(shop_id);
create index idx_categories_shop_id on public.categories(shop_id);
create index idx_menu_items_shop_id on public.menu_items(shop_id);
create index idx_tables_shop_id on public.tables(shop_id);
create index idx_orders_shop_id on public.orders(shop_id);
create index idx_bills_shop_id on public.bills(shop_id);

-- RLS
alter table public.shops enable row level security;
alter table public.menus enable row level security;
alter table public.categories enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.category_items enable row level security;
alter table public.tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.bills enable row level security;

-- Policies (Permissive for now, but scoped where possible)
-- Shops
create policy "Allow public read" on public.shops for select using (true);
create policy "Allow public insert" on public.shops for insert with check (true);
create policy "Allow public update" on public.shops for update using (true);
create policy "Allow public delete" on public.shops for delete using (true);

-- Menus
create policy "Allow public read" on public.menus for select using (true);
create policy "Allow public insert" on public.menus for insert with check (true);
create policy "Allow public update" on public.menus for update using (true);
create policy "Allow public delete" on public.menus for delete using (true);

-- Categories
create policy "Allow public read" on public.categories for select using (true);
create policy "Allow public insert" on public.categories for insert with check (true);
create policy "Allow public update" on public.categories for update using (true);
create policy "Allow public delete" on public.categories for delete using (true);

-- Menu Categories
create policy "Allow public read" on public.menu_categories for select using (true);
create policy "Allow public insert" on public.menu_categories for insert with check (true);
create policy "Allow public update" on public.menu_categories for update using (true);
create policy "Allow public delete" on public.menu_categories for delete using (true);

-- Menu Items
create policy "Allow public read" on public.menu_items for select using (true);
create policy "Allow public insert" on public.menu_items for insert with check (true);
create policy "Allow public update" on public.menu_items for update using (true);
create policy "Allow public delete" on public.menu_items for delete using (true);

-- Category Items
create policy "Allow public read" on public.category_items for select using (true);
create policy "Allow public insert" on public.category_items for insert with check (true);
create policy "Allow public update" on public.category_items for update using (true);
create policy "Allow public delete" on public.category_items for delete using (true);

-- Tables
create policy "Allow public read" on public.tables for select using (true);
create policy "Allow public insert" on public.tables for insert with check (true);
create policy "Allow public update" on public.tables for update using (true);
create policy "Allow public delete" on public.tables for delete using (true);

-- Orders
create policy "Allow public read" on public.orders for select using (true);
create policy "Allow public insert" on public.orders for insert with check (true);
create policy "Allow public update" on public.orders for update using (true);
create policy "Allow public delete" on public.orders for delete using (true);

-- Order Items
create policy "Allow public read" on public.order_items for select using (true);
create policy "Allow public insert" on public.order_items for insert with check (true);
create policy "Allow public update" on public.order_items for update using (true);
create policy "Allow public delete" on public.order_items for delete using (true);

-- Settings
create policy "Allow public read" on public.settings for select using (true);
create policy "Allow public insert" on public.settings for insert with check (true);
create policy "Allow public update" on public.settings for update using (true);

-- Bills
create policy "Enable read access for all users" on public.bills for select using (true);
create policy "Enable insert access for all users" on public.bills for insert with check (true);

-- Triggers
create or replace function public.ensure_bill_number_uppercase()
returns trigger as $$
begin
  new.bill_number := upper(new.bill_number);
  return new;
end;
$$ language plpgsql;

create trigger trg_bills_uppercase_number
before insert or update on public.bills
for each row
execute function public.ensure_bill_number_uppercase();

-- 11. Customers (Added 2025-12-03)
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id),
  name text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id, phone)
);

-- Customer Indexes
create index if not exists idx_customers_shop_id on public.customers(shop_id);
create index if not exists idx_customers_phone on public.customers(phone);

-- Customer RLS
alter table public.customers enable row level security;
create policy "Allow public read" on public.customers for select using (true);
create policy "Allow public insert" on public.customers for insert with check (true);
create policy "Allow public update" on public.customers for update using (true);

-- 12. Reviews (Added 2025-12-03)
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id),
  order_id uuid references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  menu_item_id uuid references public.menu_items(id) on delete cascade, -- Nullable: If null, it's a general order review
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  customer_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add rating columns to menu_items
alter table public.menu_items add column if not exists average_rating numeric(3, 1) default 0;
alter table public.menu_items add column if not exists rating_count integer default 0;

-- Indexes for Reviews
create index if not exists idx_reviews_shop_id on public.reviews(shop_id);
create index if not exists idx_reviews_menu_item_id on public.reviews(menu_item_id);
create index if not exists idx_reviews_order_id on public.reviews(order_id);

-- RLS for Reviews
alter table public.reviews enable row level security;
create policy "Allow public read" on public.reviews for select using (true);
create policy "Allow public insert" on public.reviews for insert with check (true);

-- Trigger to update menu_item ratings
create or replace function public.update_menu_item_rating()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') and new.menu_item_id is not null then
    update public.menu_items
    set 
      average_rating = (select avg(rating) from public.reviews where menu_item_id = new.menu_item_id),
      rating_count = (select count(*) from public.reviews where menu_item_id = new.menu_item_id)
    where id = new.menu_item_id;
  elsif (TG_OP = 'DELETE') and old.menu_item_id is not null then
    update public.menu_items
    set 
      average_rating = coalesce((select avg(rating) from public.reviews where menu_item_id = old.menu_item_id), 0),
      rating_count = (select count(*) from public.reviews where menu_item_id = old.menu_item_id)
    where id = old.menu_item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_menu_item_rating ON public.reviews;
CREATE TRIGGER trg_update_menu_item_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_menu_item_rating();

-- Trigger to update shop ratings (Added 2025-12-03)
CREATE OR REPLACE FUNCTION public.update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.shop_id IS NOT NULL THEN
    UPDATE public.shops
    SET 
      average_rating = (SELECT AVG(rating) FROM public.reviews WHERE shop_id = NEW.shop_id),
      rating_count = (SELECT COUNT(*) FROM public.reviews WHERE shop_id = NEW.shop_id)
    WHERE id = NEW.shop_id;
  ELSIF (TG_OP = 'DELETE') AND OLD.shop_id IS NOT NULL THEN
    UPDATE public.shops
    SET 
      average_rating = COALESCE((SELECT AVG(rating) FROM public.reviews WHERE shop_id = OLD.shop_id), 0),
      rating_count = (SELECT COUNT(*) FROM public.reviews WHERE shop_id = OLD.shop_id)
    WHERE id = OLD.shop_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_shop_rating ON public.reviews;
CREATE TRIGGER trg_update_shop_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_shop_rating();
