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
-- Create User Roles table
create type public.app_role as enum ('admin', 'staff');

create table public.user_roles (
  id uuid references auth.users on delete cascade not null primary key,
  role public.app_role not null default 'staff',
  shop_id uuid references public.shops(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(id, shop_id)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Policies for user_roles
-- Admins can read all roles for their shop
create policy "Admins can read roles"
  on public.user_roles
  for select
  using (
    auth.uid() in (
      select id from public.user_roles where role = 'admin'
    )
  );

-- Users can read their own role
create policy "Users can read own role"
  on public.user_roles
  for select
  using (
    auth.uid() = id
  );

-- Only Service Role (or potentially Admin via function) can insert/update roles
-- For now, we'll rely on the API route using Service Role for management

-- Update RLS for other tables to restrict access based on role

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is staff or admin
create or replace function public.is_staff_or_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid()
    and (role = 'staff' or role = 'admin')
  );
end;
$$ language plpgsql security definer;

-- Update Policies for Shops (Admin only for update)
drop policy if exists "Allow public update" on public.shops;
create policy "Admins can update shop"
  on public.shops
  for update
  using (public.is_admin());

-- Update Policies for Menu Items (Admin only for CUD)
drop policy if exists "Allow public insert" on public.menu_items;
drop policy if exists "Allow public update" on public.menu_items;
drop policy if exists "Allow public delete" on public.menu_items;

create policy "Admins can insert menu items"
  on public.menu_items
  for insert
  with check (public.is_admin());

create policy "Admins can update menu items"
  on public.menu_items
  for update
  using (public.is_admin());

create policy "Admins can delete menu items"
  on public.menu_items
  for delete
  using (public.is_admin());

-- Update Policies for Orders (Staff/Admin can view/update)
-- Public can insert (Customers)
-- Staff/Admin can select all
-- Customers can select their own (if we had customer auth, but for now public read is okay for order status if we use UUIDs which are hard to guess, 
-- BUT for admin panel listing, we need to ensure only staff/admin can see ALL orders. 
-- Since we don't have customer auth yet, we'll keep public read for now but maybe restrict listing?)

-- Actually, for now, let's keep public read for simplicity as requested, 
-- but strictly enforce Admin-only for Settings and Menu Editing.

-- Settings (Admin only for update)
drop policy if exists "Allow public update" on public.settings;
create policy "Admins can update settings"
  on public.settings
  for update
  using (public.is_admin());

-- Insert initial admin user role (You will need to manually link this to your real user ID after signup)
-- insert into public.user_roles (id, role, shop_id) values ('YOUR_USER_ID', 'admin', 'SHOP_ID');
-- Add is_live column to shops table
alter table public.shops add column is_live boolean not null default false;

-- Update RLS policies for shops to allow public read only if is_live is true
-- (or if we want to allow public read of basic info like name/logo even if not live? 
-- The requirement says "unless admin makes the shop live, customers can't access its landing page or menu")
-- So we should restrict public access.

-- However, for the "Coming Soon" page, we might still need to fetch the shop name/logo.
-- So let's allow public read of `shops` table generally (so we can check `is_live` status),
-- but maybe restrict `menu_items` and `categories`?

-- Actually, simplest is to allow public read of shops, and handle the "Coming Soon" logic in the application layer (Next.js).
-- If we restrict DB access, the "Coming Soon" page might fail to load the shop name.

-- Let's just add the column for now.
-- Refine RLS Policies for Strict Multi-Tenancy

-- 1. Helper Functions
create or replace function public.is_admin_of(shop_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid()
    and shop_id = shop_uuid
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_staff_of(shop_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid()
    and shop_id = shop_uuid
    and (role = 'staff' or role = 'admin')
  );
end;
$$ language plpgsql security definer;

-- 2. Drop existing policies to start fresh
drop policy if exists "Allow public read" on public.shops;
drop policy if exists "Allow public insert" on public.shops;
drop policy if exists "Allow public update" on public.shops;
drop policy if exists "Allow public delete" on public.shops;
drop policy if exists "Admins can update shop" on public.shops;

drop policy if exists "Allow public read" on public.menus;
drop policy if exists "Allow public insert" on public.menus;
drop policy if exists "Allow public update" on public.menus;
drop policy if exists "Allow public delete" on public.menus;

drop policy if exists "Allow public read" on public.categories;
drop policy if exists "Allow public insert" on public.categories;
drop policy if exists "Allow public update" on public.categories;
drop policy if exists "Allow public delete" on public.categories;

drop policy if exists "Allow public read" on public.menu_categories;
drop policy if exists "Allow public insert" on public.menu_categories;
drop policy if exists "Allow public update" on public.menu_categories;
drop policy if exists "Allow public delete" on public.menu_categories;

drop policy if exists "Allow public read" on public.menu_items;
drop policy if exists "Allow public insert" on public.menu_items;
drop policy if exists "Allow public update" on public.menu_items;
drop policy if exists "Allow public delete" on public.menu_items;
drop policy if exists "Admins can insert menu items" on public.menu_items;
drop policy if exists "Admins can update menu items" on public.menu_items;
drop policy if exists "Admins can delete menu items" on public.menu_items;

drop policy if exists "Allow public read" on public.category_items;
drop policy if exists "Allow public insert" on public.category_items;
drop policy if exists "Allow public update" on public.category_items;
drop policy if exists "Allow public delete" on public.category_items;

drop policy if exists "Allow public read" on public.tables;
drop policy if exists "Allow public insert" on public.tables;
drop policy if exists "Allow public update" on public.tables;
drop policy if exists "Allow public delete" on public.tables;

drop policy if exists "Allow public read" on public.orders;
drop policy if exists "Allow public insert" on public.orders;
drop policy if exists "Allow public update" on public.orders;
drop policy if exists "Allow public delete" on public.orders;

drop policy if exists "Allow public read" on public.order_items;
drop policy if exists "Allow public insert" on public.order_items;
drop policy if exists "Allow public update" on public.order_items;
drop policy if exists "Allow public delete" on public.order_items;

drop policy if exists "Allow public read" on public.settings;
drop policy if exists "Allow public insert" on public.settings;
drop policy if exists "Allow public update" on public.settings;
drop policy if exists "Admins can update settings" on public.settings;

drop policy if exists "Enable read access for all users" on public.bills;
drop policy if exists "Enable insert access for all users" on public.bills;

-- 3. Define New Policies

-- SHOPS
-- Public can read all shops (needed for landing pages/checking slugs)
create policy "Public can read shops" on public.shops for select using (true);
-- Public can insert (for signup flow)
create policy "Public can create shops" on public.shops for insert with check (true);
-- Only Admin of that shop can update
create policy "Admin can update own shop" on public.shops for update using (public.is_admin_of(id));

-- MENUS
-- Public can read
create policy "Public can read active menus" on public.menus for select using (is_active = true);
create policy "Admins can read own menus" on public.menus for select using (public.is_admin_of(shop_id));
-- Admin can manage
create policy "Admin can insert menus" on public.menus for insert with check (public.is_admin_of(shop_id));
create policy "Admin can update menus" on public.menus for update using (public.is_admin_of(shop_id));
create policy "Admin can delete menus" on public.menus for delete using (public.is_admin_of(shop_id));

-- CATEGORIES
-- Public can read
create policy "Public can read categories" on public.categories for select using (true);
-- Admin can manage
create policy "Admin can insert categories" on public.categories for insert with check (public.is_admin_of(shop_id));
create policy "Admin can update categories" on public.categories for update using (public.is_admin_of(shop_id));
create policy "Admin can delete categories" on public.categories for delete using (public.is_admin_of(shop_id));

-- MENU CATEGORIES (Junction)
-- Public can read
create policy "Public can read menu_categories" on public.menu_categories for select using (true);
-- Admin can manage (Need to check via menu_id or category_id, usually menu_id is enough context if we trust the join)
-- Since it's a junction, we check if user is admin of the shop owning the menu
create policy "Admin can insert menu_categories" on public.menu_categories for insert with check (
  exists (select 1 from public.menus where id = menu_id and public.is_admin_of(shop_id))
);
create policy "Admin can update menu_categories" on public.menu_categories for update using (
  exists (select 1 from public.menus where id = menu_id and public.is_admin_of(shop_id))
);
create policy "Admin can delete menu_categories" on public.menu_categories for delete using (
  exists (select 1 from public.menus where id = menu_id and public.is_admin_of(shop_id))
);

-- MENU ITEMS
-- Public can read
create policy "Public can read menu_items" on public.menu_items for select using (true);
-- Admin can manage
create policy "Admin can insert menu_items" on public.menu_items for insert with check (public.is_admin_of(shop_id));
create policy "Admin can update menu_items" on public.menu_items for update using (public.is_admin_of(shop_id));
create policy "Admin can delete menu_items" on public.menu_items for delete using (public.is_admin_of(shop_id));

-- CATEGORY ITEMS (Junction)
-- Public can read
create policy "Public can read category_items" on public.category_items for select using (true);
-- Admin can manage (Check via category_id)
create policy "Admin can insert category_items" on public.category_items for insert with check (
  exists (select 1 from public.categories where id = category_id and public.is_admin_of(shop_id))
);
create policy "Admin can update category_items" on public.category_items for update using (
  exists (select 1 from public.categories where id = category_id and public.is_admin_of(shop_id))
);
create policy "Admin can delete category_items" on public.category_items for delete using (
  exists (select 1 from public.categories where id = category_id and public.is_admin_of(shop_id))
);

-- TABLES
-- Public can read (needed for QR code landing?)
create policy "Public can read tables" on public.tables for select using (true);
-- Admin can manage
create policy "Admin can insert tables" on public.tables for insert with check (public.is_admin_of(shop_id));
create policy "Admin can update tables" on public.tables for update using (public.is_admin_of(shop_id));
create policy "Admin can delete tables" on public.tables for delete using (public.is_admin_of(shop_id));

-- ORDERS
-- Public can insert (Placing order)
create policy "Public can insert orders" on public.orders for insert with check (true);
-- Public can read their own orders? Or just open for now for simplicity of tracking?
-- Let's allow public read for now, but we should probably restrict it eventually.
create policy "Public can read orders" on public.orders for select using (true);
-- Staff/Admin can update (Status changes)
create policy "Staff can update orders" on public.orders for update using (public.is_staff_of(shop_id));

-- ORDER ITEMS
-- Public can insert
create policy "Public can insert order_items" on public.order_items for insert with check (true);
-- Public can read
create policy "Public can read order_items" on public.order_items for select using (true);
-- Staff/Admin can update (if needed, e.g. corrections) or delete
create policy "Staff can update order_items" on public.order_items for update using (
  exists (select 1 from public.orders where id = order_id and public.is_staff_of(shop_id))
);
create policy "Staff can delete order_items" on public.order_items for delete using (
  exists (select 1 from public.orders where id = order_id and public.is_staff_of(shop_id))
);

-- SETTINGS
-- Public can read
create policy "Public can read settings" on public.settings for select using (true);
-- Admin can update
create policy "Admin can update settings" on public.settings for update using (public.is_admin_of(shop_id));
-- Admin can insert (initial setup)
create policy "Admin can insert settings" on public.settings for insert with check (public.is_admin_of(shop_id));

-- BILLS
-- Staff/Admin can read
create policy "Staff can read bills" on public.bills for select using (public.is_staff_of(shop_id));
-- Staff/Admin can insert
create policy "Staff can insert bills" on public.bills for insert with check (public.is_staff_of(shop_id));

-- CUSTOMERS
-- Public can read/insert/update (Self-registration/lookup)
create policy "Public can read customers" on public.customers for select using (true);
create policy "Public can insert customers" on public.customers for insert with check (true);
create policy "Public can update customers" on public.customers for update using (true);

-- REVIEWS
-- Public can read
create policy "Public can read reviews" on public.reviews for select using (true);
-- Public can insert
create policy "Public can insert reviews" on public.reviews for insert with check (true);

-- Add owner_id to shops and sync to user_roles

-- 1. Add owner_id column
alter table public.shops add column owner_id uuid references auth.users(id);

-- 2. Trigger to automatically create admin role for owner
create or replace function public.create_shop_owner_role()
returns trigger as $$
begin
  if new.owner_id is not null then
    insert into public.user_roles (id, role, shop_id)
    values (new.owner_id, 'admin', new.id)
    on conflict (id, shop_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_create_shop_owner_role
after insert on public.shops
for each row
execute function public.create_shop_owner_role();

-- 3. Update RLS for shops to allow owner to update (redundant if user_roles works, but good backup)
-- We'll stick to user_roles based policy for consistency, but the trigger ensures user_roles is populated.
-- Allow shop owners to insert/manage their own admin role
-- This acts as a fallback if the trigger fails or for repair

create policy "Shop owners can insert their own admin role"
on public.user_roles
for insert
with check (
  auth.uid() = id -- Can only assign to self
  and role = 'admin' -- Can only be admin
  and exists ( -- Must own the shop
    select 1 from public.shops
    where id = shop_id
    and owner_id = auth.uid()
  )
);

create policy "Shop owners can update their own admin role"
on public.user_roles
for update
using (
  auth.uid() = id
  and exists (
    select 1 from public.shops
    where id = shop_id
    and owner_id = auth.uid()
  )
);
-- Secure RPC to assign admin role to shop owner
create or replace function public.assign_shop_admin(target_shop_id uuid)
returns void as $$
declare
  is_owner boolean;
begin
  -- Check if the current user is the owner of the shop
  select exists(
    select 1 from public.shops
    where id = target_shop_id
    and owner_id = auth.uid()
  ) into is_owner;

  if is_owner then
    insert into public.user_roles (id, role, shop_id)
    values (auth.uid(), 'admin', target_shop_id)
    on conflict (id, shop_id) do nothing;
  else
    raise exception 'Not authorized: You are not the owner of this shop.';
  end if;
end;
$$ language plpgsql security definer;
-- Fix infinite recursion in user_roles policy

-- 1. Ensure is_admin is security definer (bypasses RLS)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 2. Drop recursive policy
drop policy if exists "Admins can read roles" on public.user_roles;

-- 3. Re-create policy using the security definer function
-- This avoids the recursion because is_admin() runs with owner privileges (bypassing RLS)
create policy "Admins can read roles"
  on public.user_roles
  for select
  using (
    public.is_admin()
  );
-- Fix settings table for multi-tenancy

-- 1. Drop the singleton constraint
alter table public.settings drop constraint if exists settings_id_check;

-- 2. Make id an identity column if it isn't (or just rely on serial)
-- Since we can't easily check if it's serial, let's just alter it to be safe or leave it if it's already serial.
-- Actually, the safest way is to make shop_id the main identifier for lookups.

-- 3. Add unique constraint on shop_id
alter table public.settings add constraint settings_shop_id_key unique (shop_id);

-- 4. Update RLS policies for settings to be shop-specific
drop policy if exists "Public settings access" on public.settings;
drop policy if exists "Admin settings update" on public.settings;

create policy "Public settings access"
  on public.settings for select
  using (true);

create policy "Admin settings update"
  on public.settings for update
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.shop_id = settings.shop_id
      and user_roles.role = 'admin'
      and user_roles.id = auth.uid()
    )
  );

create policy "Admin settings insert"
  on public.settings for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.shop_id = settings.shop_id
      and user_roles.role = 'admin'
      and user_roles.id = auth.uid()
    )
  );
-- Make settings.id an identity column so it auto-increments
-- We first drop the old check constraint if it still exists (just in case)
alter table public.settings drop constraint if exists settings_id_check;

-- Make id an identity column
-- We use 'generated by default' so we can still insert specific IDs if needed (like for migration)
-- or 'generated always' if we want to enforce it. 'generated by default' is safer for existing data.
alter table public.settings alter column id add generated by default as identity;
-- Sync the identity sequence for settings.id
-- This ensures the next generated ID is higher than any existing ID
select setval(pg_get_serial_sequence('public.settings', 'id'), coalesce(max(id), 0) + 1, false) from public.settings;
