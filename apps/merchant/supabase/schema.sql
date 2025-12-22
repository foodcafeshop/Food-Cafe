-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create User Roles Enum
create type public.app_role as enum ('admin', 'staff');

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
  gallery_images text[] default array[]::text[] check (cardinality(gallery_images) <= 16),
  average_rating numeric(3, 1) default 0,
  rating_count integer default 0,
  is_live boolean not null default false,
  owner_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Menus
create table public.menus (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default false,
  images text[] default array[]::text[],
  tags text[] default array[]::text[],
  dietary_type text check (dietary_type in ('all', 'veg', 'non_veg', 'vegan')) default 'all',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id, name)
);

-- 2. Categories (Global Sections)
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  image text,
  tags text[] default array[]::text[],
  dietary_type text check (dietary_type in ('all', 'veg', 'non_veg', 'vegan')) default 'all',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id, name)
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
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  offer_price decimal(10, 2),
  images text[] default array[]::text[],
  dietary_type text check (dietary_type in ('veg', 'non_veg', 'vegan')) default 'veg',
  tags text[] default array[]::text[],
  is_available boolean default true,
  is_popular boolean default false,
  is_featured boolean default false,
  average_rating numeric(3, 1) default 0,
  rating_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id, name)
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
  shop_id uuid references public.shops(id) on delete cascade,
  label text not null,
  status text check (status in ('empty', 'occupied', 'billed')) default 'empty',
  seats integer default 2,
  x integer default 0,
  y integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id, label)
);

-- 7. Customers
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id) on delete cascade,
  name text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id, phone)
);

-- 8. Orders
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id) on delete cascade,
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

-- 9. Order Items
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

-- 10. Settings
create table public.settings (
  id integer generated by default as identity primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  currency text default 'USD',
  language text default 'en',
  tax_rate decimal(5, 2) default 10.00,
  service_charge decimal(5, 2) default 5.00,
  dark_mode boolean default false,
  sound_notifications boolean default true,
  auto_print boolean default false,
  enable_otp boolean default false,
  tax_included_in_price boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id)
);

-- ... (Keep other tables)

-- Verify Table OTP
create or replace function public.verify_table_otp(input_table_id uuid, input_otp text)
returns boolean as $$
declare
  otp_enabled boolean;
  shop_uuid uuid;
begin
  -- Get shop_id from table
  select shop_id into shop_uuid from public.tables where id = input_table_id;
  
  -- Check settings (default to false if no settings found)
  select enable_otp into otp_enabled from public.settings where shop_id = shop_uuid;
  
  -- If OTP is disabled (or settings missing), bypass check
  if otp_enabled is not true then
    return true;
  end if;

  return exists (
    select 1 from public.table_secrets
    where table_id = input_table_id
    and otp = input_otp
  );
end;
$$ language plpgsql security definer;

-- 11. Bills
create table if not exists public.bills (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  table_id uuid references public.tables(id),
  bill_number text not null,
  total_amount numeric not null,
  payment_method text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_ids uuid[] not null,
  items_snapshot jsonb not null,
  breakdown jsonb
);

-- 12. Reviews
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  menu_item_id uuid references public.menu_items(id) on delete cascade, -- Nullable: If null, it's a general order review
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  customer_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. User Roles
create table public.user_roles (
  id uuid references auth.users on delete cascade not null primary key,
  role public.app_role not null default 'staff',
  shop_id uuid references public.shops(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(id, shop_id)
);

-- 14. Table Secrets (OTP)
create table public.table_secrets (
  table_id uuid references public.tables(id) on delete cascade primary key,
  otp text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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
create index if not exists idx_customers_shop_id on public.customers(shop_id);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_reviews_shop_id on public.reviews(shop_id);
create index if not exists idx_reviews_menu_item_id on public.reviews(menu_item_id);
create index if not exists idx_reviews_order_id on public.reviews(order_id);

-- Helper Functions (Security Definer)

-- Check if user is admin (Global or Shop context implied by usage)
-- Note: This checks if the user has ANY admin role. For shop-specific checks, use is_admin_of.
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

-- Check if user is admin of a specific shop
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

-- Check if user is staff or admin of a specific shop
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

-- Verify Table OTP
create or replace function public.verify_table_otp(input_table_id uuid, input_otp text)
returns boolean as $$
begin
  return exists (
    select 1 from public.table_secrets
    where table_id = input_table_id
    and otp = input_otp
  );
end;
$$ language plpgsql security definer;

-- Triggers

-- Ensure Bill Number Uppercase
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

-- Update Menu Item Ratings
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

CREATE TRIGGER trg_update_menu_item_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_menu_item_rating();

-- Update Shop Ratings
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

CREATE TRIGGER trg_update_shop_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_shop_rating();

-- Create Shop Owner Role
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

-- RPC: Assign Shop Admin
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

-- RLS Enablement
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
alter table public.customers enable row level security;
alter table public.reviews enable row level security;
alter table public.user_roles enable row level security;
alter table public.table_secrets enable row level security;

-- RLS Policies

-- SHOPS
-- Public can read all shops (needed for landing pages/checking slugs)
create policy "Public can read shops" on public.shops for select using (true);
-- Public can insert (for signup flow)
create policy "Public can create shops" on public.shops for insert with check (true);
-- Only Admin of that shop can update
create policy "Admin can update own shop" on public.shops for update using (public.is_admin_of(id));
-- Admin can delete own shop
create policy "Admin can delete own shop" on public.shops for delete using (public.is_admin_of(id));

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
-- Admin can manage
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
-- Admin can manage
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
create policy "Admin can delete tables" on public.tables for delete using (public.is_admin_of(shop_id));
create policy "Staff can update tables" on public.tables for update using (public.is_staff_of(shop_id));

-- ORDERS
-- Public can insert (Placing order)
create policy "Public can insert orders" on public.orders for insert with check (true);
-- Public can read (Open for now for simplicity)
create policy "Public can read orders" on public.orders for select using (true);
-- Staff/Admin can update (Status changes)
create policy "Staff can update orders" on public.orders for update using (public.is_staff_of(shop_id));

-- ORDER ITEMS
-- Public can insert
create policy "Public can insert order_items" on public.order_items for insert with check (true);
-- Public can read
create policy "Public can read order_items" on public.order_items for select using (true);
-- Staff/Admin can update/delete
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
-- Admin can insert
create policy "Admin can insert settings" on public.settings for insert with check (public.is_admin_of(shop_id));

-- BILLS
-- Staff/Admin can read
create policy "Staff can read bills" on public.bills for select using (public.is_staff_of(shop_id));
-- Staff/Admin can insert
create policy "Staff can insert bills" on public.bills for insert with check (public.is_staff_of(shop_id));

-- CUSTOMERS
-- Public can read/insert/update
create policy "Public can read customers" on public.customers for select using (true);
create policy "Public can insert customers" on public.customers for insert with check (true);
create policy "Public can update customers" on public.customers for update using (true);

-- REVIEWS
-- Public can read
create policy "Public can read reviews" on public.reviews for select using (true);
-- Public can insert
create policy "Public can insert reviews" on public.reviews for insert with check (true);

-- USER ROLES
-- Admins can read roles (using security definer function to avoid recursion)
create policy "Admins can read roles"
  on public.user_roles
  for select
  using (
    public.is_admin()
  );

-- Users can read their own role
create policy "Users can read own role"
  on public.user_roles
  for select
  using (
    auth.uid() = id
  );

-- Shop owners can insert their own admin role (Fallback/Repair)
create policy "Shop owners can insert their own admin role"
on public.user_roles
for insert
with check (
  auth.uid() = id
  and role = 'admin'
  and exists (
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

-- TABLE SECRETS (OTP)
-- Admin can manage
create policy "Admin can insert table_secrets" on public.table_secrets for insert with check (
  exists (select 1 from public.tables where id = table_id and public.is_admin_of(shop_id))
);
create policy "Admin can update table_secrets" on public.table_secrets for update using (
  exists (select 1 from public.tables where id = table_id and public.is_admin_of(shop_id))
);
create policy "Admin can delete table_secrets" on public.table_secrets for delete using (
  exists (select 1 from public.tables where id = table_id and public.is_admin_of(shop_id))
);
-- Staff can read OTPs (for display in management UI)
create policy "Staff can read table_secrets" on public.table_secrets for select using (
  exists (select 1 from public.tables where id = table_id and public.is_staff_of(shop_id))
);

-- Trigger: Rotate OTP on Table Empty
create or replace function public.rotate_table_otp()
returns trigger as $$
declare
  otp_enabled boolean;
  new_otp text;
begin
  if new.status = 'empty' and old.status != 'empty' then
    -- Check settings
    select enable_otp into otp_enabled from public.settings where shop_id = new.shop_id;
    
    if otp_enabled is true then
      new_otp := floor(random() * 9000 + 1000)::text;
    else
      new_otp := '0000';
    end if;

    insert into public.table_secrets (table_id, otp)
    values (new.id, new_otp)
    on conflict (table_id) do update
    set otp = excluded.otp;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_rotate_table_otp
after update on public.tables
for each row
execute function public.rotate_table_otp();

-- Trigger: Initialize OTP on Table Creation
create or replace function public.init_table_otp()
returns trigger as $$
declare
  otp_enabled boolean;
  new_otp text;
begin
  -- Check settings
  select enable_otp into otp_enabled from public.settings where shop_id = new.shop_id;
  
  if otp_enabled is true then
    new_otp := floor(random() * 9000 + 1000)::text;
  else
    new_otp := '0000';
  end if;

  insert into public.table_secrets (table_id, otp)
  values (new.id, new_otp)
  on conflict (table_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_init_table_otp
after insert on public.tables
for each row
execute function public.init_table_otp();

-- Trigger: Update OTPs when Settings Change
create or replace function public.update_otps_on_settings_change()
returns trigger as $$
begin
  if new.enable_otp is distinct from old.enable_otp then
    if new.enable_otp is false then
      -- Set all OTPs to 0000 for this shop (Upsert to ensure they exist)
      insert into public.table_secrets (table_id, otp)
      select id, '0000' from public.tables where shop_id = new.shop_id
      on conflict (table_id) do update set otp = '0000';
    else
      -- Generate random OTPs for this shop (Upsert)
      insert into public.table_secrets (table_id, otp)
      select id, floor(random() * 9000 + 1000)::text from public.tables where shop_id = new.shop_id
      on conflict (table_id) do update set otp = excluded.otp;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_otps_on_settings_change
after update on public.settings
for each row
execute function public.update_otps_on_settings_change();

-- RPC: Occupy Table (Called when customer logs in)
create or replace function public.occupy_table(input_table_id uuid)
returns boolean as $$
declare
  rows_updated integer;
begin
  update public.tables
  set status = 'occupied',
      updated_at = timezone('utc'::text, now())
  where id = input_table_id
  and status = 'empty'; -- Only occupy if currently empty
  
  get diagnostics rows_updated = row_count;
  return rows_updated > 0;
end;
$$ language plpgsql security definer;

-- Grant permissions to allow anonymous users to call this
grant execute on function public.occupy_table(uuid) to anon, authenticated, service_role;

-- Initial Data Seeding
-- (Settings are now shop-specific, so we don't insert a global row 1)

-- SESSION MANAGEMENT REFACTOR
-- Add active_customers column to tables
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS active_customers JSONB DEFAULT '[]'::JSONB;

-- RPC: Join Table (Replaces occupy_table logic for multi-user)
CREATE OR REPLACE FUNCTION public.join_table(input_table_id UUID, customer_info JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE public.tables
  SET status = 'occupied',
      active_customers = active_customers || customer_info,
      updated_at = timezone('utc'::text, now())
  WHERE id = input_table_id;
  
  GET DIAGNOSTICS rows_updated = row_count;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.join_table(UUID, JSONB) TO anon, authenticated, service_role;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_shops_is_live ON public.shops(is_live);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON public.menus(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_featured ON public.menu_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_items_shop_id_featured ON public.menu_items(shop_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON public.menu_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_category_items_sort ON public.category_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_reviews_item_created ON public.reviews(menu_item_id, created_at DESC);

-- ========================================
-- Inventory Management
-- ========================================

-- 1. Inventory Items (Raw Materials)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  unit TEXT NOT NULL, -- 'kg', 'g', 'L', 'ml', 'pcs', 'dozen'
  stock_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
  low_stock_threshold DECIMAL(10, 3) DEFAULT 10,
  cost_per_unit DECIMAL(10, 2), -- for COGS calculation (future)
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(shop_id, name)
);

-- 2. Menu Item Ingredients (Recipes)
CREATE TABLE IF NOT EXISTS public.menu_item_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10, 3) NOT NULL, -- amount needed per menu item
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(menu_item_id, inventory_item_id)
);

-- 3. Inventory Adjustments (Audit Trail)
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  previous_quantity DECIMAL(10, 3),
  new_quantity DECIMAL(10, 3),
  adjustment DECIMAL(10, 3) NOT NULL,
  reason TEXT CHECK (reason IN ('restock', 'usage', 'order', 'wastage', 'damage', 'theft', 'correction', 'other')),
  notes TEXT,
  reference_id UUID, -- link to order_id if reason='order'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inventory Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_shop ON public.inventory_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON public.inventory_items(shop_id, stock_quantity, low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_menu_item ON public.menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_inventory_item ON public.menu_item_ingredients(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_shop ON public.inventory_adjustments(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_item ON public.inventory_adjustments(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created ON public.inventory_adjustments(created_at DESC);

-- Inventory RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read inventory_items" ON public.inventory_items FOR SELECT USING (public.is_staff_of(shop_id));
CREATE POLICY "Admin can insert inventory_items" ON public.inventory_items FOR INSERT WITH CHECK (public.is_admin_of(shop_id));
CREATE POLICY "Admin can update inventory_items" ON public.inventory_items FOR UPDATE USING (public.is_admin_of(shop_id));
CREATE POLICY "Admin can delete inventory_items" ON public.inventory_items FOR DELETE USING (public.is_admin_of(shop_id));

ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read menu_item_ingredients" ON public.menu_item_ingredients FOR SELECT USING (true);
CREATE POLICY "Admin can insert menu_item_ingredients" ON public.menu_item_ingredients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.menu_items WHERE id = menu_item_id AND public.is_admin_of(shop_id)));
CREATE POLICY "Admin can update menu_item_ingredients" ON public.menu_item_ingredients FOR UPDATE USING (EXISTS (SELECT 1 FROM public.menu_items WHERE id = menu_item_id AND public.is_admin_of(shop_id)));
CREATE POLICY "Admin can delete menu_item_ingredients" ON public.menu_item_ingredients FOR DELETE USING (EXISTS (SELECT 1 FROM public.menu_items WHERE id = menu_item_id AND public.is_admin_of(shop_id)));

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read inventory_adjustments" ON public.inventory_adjustments FOR SELECT USING (public.is_staff_of(shop_id));
CREATE POLICY "Staff can insert inventory_adjustments" ON public.inventory_adjustments FOR INSERT WITH CHECK (public.is_staff_of(shop_id));

-- Inventory updated_at Trigger
CREATE OR REPLACE FUNCTION public.update_inventory_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_item_timestamp();

-- Realtime Configuration
-- Note: 'supabase_realtime' publication is created by default in Supabase.
-- We just need to add our tables to it.
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.tables;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.menus;
-- Migration: Inventory Auto-Deduction Trigger on Order Prepare

CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
  order_item RECORD;
  recipe_item RECORD;
  qty_change DECIMAL;
  adjustment_note TEXT;
  is_reversion BOOLEAN;
BEGIN
  -- Determine if we need to Deduct or Revert based on status transition
  IF OLD.status = 'queued' AND NEW.status = 'preparing' THEN
    -- Deduction: Kitchen started preparing
    is_reversion := false;
    adjustment_note := 'Order #' || COALESCE(NEW.order_number, 'N/A');
  ELSIF OLD.status = 'preparing' AND (NEW.status = 'queued' OR NEW.status = 'cancelled') THEN
    -- Reversion: Order sent back to queue or cancelled after prep started
    is_reversion := true;
    adjustment_note := 'Revert Order #' || COALESCE(NEW.order_number, 'N/A') || ' (' || NEW.status || ')';
  ELSE
    -- No inventory action for other transitions
    RETURN NEW;
  END IF;

  -- Iterate through all items in the order
  FOR order_item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
    
    -- Iterate through all ingredients required for this menu item (Recipe)
    FOR recipe_item IN SELECT * FROM public.menu_item_ingredients WHERE menu_item_id = order_item.menu_item_id LOOP
      
      -- Calculate quantity impact
      -- If reversion, we ADD to stock. If deduction, we REMOVE (negative).
      qty_change := recipe_item.quantity_required * order_item.quantity;
      IF NOT is_reversion THEN
        qty_change := -qty_change;
      END IF;
      
      -- Update stock quantity and capture the new value
      WITH updated_stock AS (
        UPDATE public.inventory_items
        SET stock_quantity = stock_quantity + qty_change,
            updated_at = NOW()
        WHERE id = recipe_item.inventory_item_id
        RETURNING id, stock_quantity, shop_id
      )
      -- Log the adjustment
      INSERT INTO public.inventory_adjustments (
          shop_id,
          inventory_item_id,
          previous_quantity,
          new_quantity,
          adjustment,
          reason,
          reference_id,
          notes
      )
      SELECT 
          updated_stock.shop_id,
          updated_stock.id,
          updated_stock.stock_quantity - qty_change, -- Previous
          updated_stock.stock_quantity,              -- New
          qty_change,
          'order',
          NEW.id,
          adjustment_note
      FROM updated_stock;
      
    END LOOP;
    
  END LOOP;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS trg_deduct_inventory_on_prepare ON public.orders;
CREATE TRIGGER trg_deduct_inventory_on_prepare
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.deduct_inventory_on_order();

-- Migration: Enforce Case-Insensitive Uniqueness on Inventory Item Names

-- 1. Clean up potential existing duplicates (keep the one with latest update or creation)
-- This is a safety step. In a real prod env, we might want manual intervention, but for now we'll keep the most recently updated one.
-- (Skipping complex cleanup for now to avoid data loss, assuming table is mostly clean or user will handle conflicts)

-- 2. Drop existing exact-match constraint if it exists (by name)
-- Note: The constraint name is usually inventory_items_shop_id_name_key
ALTER TABLE public.inventory_items 
DROP CONSTRAINT IF EXISTS inventory_items_shop_id_name_key;

-- 3. Create unique index on (shop_id, lower(name))
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_shop_name_unique 
ON public.inventory_items (shop_id, lower(name));
