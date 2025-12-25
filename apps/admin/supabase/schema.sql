-- ========================================
-- Super Admin App Schema
-- ========================================

-- Helper: Check if Super Admin (Global Context)
-- Returns true if user has 'admin' role and shop_id is NULL
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid()
    and role = 'admin'
    and shop_id is null
  );
end;
$$ language plpgsql security definer;

-- 1. Admin Audit Logs
create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references auth.users(id),
  action text not null, -- e.g. 'banned_shop', 'impersonated_user'
  target_id uuid, -- ID of shop or user affected
  details jsonb, -- snapshot of changes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Global Broadcasts
create table if not exists public.global_broadcasts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text not null,
  priority text check (priority in ('info', 'warning', 'critical')) default 'info',
  expires_at timestamp with time zone,
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Feature Flags
create table if not exists public.feature_flags (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  description text,
  is_enabled_globally boolean default false,
  allowed_shop_ids uuid[] default array[]::uuid[], -- Whitelist specific shops
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Support Tickets
create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references public.shops(id) on delete cascade not null,
  subject text not null,
  status text check (status in ('open', 'in_progress', 'resolved', 'closed')) default 'open',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  messages jsonb[] default array[]::jsonb[], -- Array of objects { sender: 'admin'|'merchant', text: '', time: '' }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Admin Tables
-- Audit Logs: Only Super Admin can read/write
alter table public.admin_audit_logs enable row level security;
create policy "Super Admin can manage audit logs" on public.admin_audit_logs for all using (public.is_super_admin());

-- Broadcasts: Super Admin manages, Public (authenticated) can read active
alter table public.global_broadcasts enable row level security;
create policy "Super Admin can manage broadcasts" on public.global_broadcasts for all using (public.is_super_admin());
create policy "Merchants can read active broadcasts" on public.global_broadcasts for select using (is_active = true and auth.role() = 'authenticated');

-- Feature Flags: Super Admin manages, Everyone reads (to check flags)
alter table public.feature_flags enable row level security;
create policy "Super Admin can manage flags" on public.feature_flags for all using (public.is_super_admin());
create policy "Public can read flags" on public.feature_flags for select using (true);

-- 5. Support Tickets: 
-- Super Admin: Manage all
-- Shop Admin: Manage own
alter table public.support_tickets enable row level security;
create policy "Super Admin can manage all tickets" on public.support_tickets for all using (public.is_super_admin());
create policy "Shop Admin can manage own tickets" on public.support_tickets for all using (public.is_admin_of(shop_id));

-- Helper: Get Total Users (for Dashboard)
create or replace function public.get_total_users()
returns integer as $$
declare
  count integer;
begin
  select count(*) into count from auth.users;
  return count;
end;
$$ language plpgsql security definer;
