-- 0001_init.sql
create extension if not exists pgcrypto;

-- Profiles mapped to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  active_family_id uuid,
  tz text default 'Europe/Copenhagen',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists profiles_active_family_idx on public.profiles(active_family_id);

-- Families
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Memberships
do $$ begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('admin','member');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_status') then
    create type public.member_status as enum ('active','left');
  end if;
end $$;

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  status public.member_status not null default 'active',
  created_at timestamptz default now(),
  primary key (family_id, user_id)
);

-- Invites (email invite OR code join)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'invite_status') then
    create type public.invite_status as enum ('pending','accepted','revoked','expired');
  end if;
end $$;

create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text,                              -- optional if using code-only
  code text not null,                       -- human friendly, 6–8 chars
  invited_by uuid not null references auth.users(id),
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz default now(),
  unique (family_id, code)
);

-- Helper: is current user member of a family?
create or replace function public.is_family_member(target_family uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.family_members
    where family_id = target_family and user_id = auth.uid() and status='active'
  );
$$;

-- RPC: create family (adds creator as admin & sets active_family_id)
create or replace function public.create_family(p_name text, p_slug text)
returns uuid
language plpgsql security definer as $$
declare fid uuid;
begin
  insert into public.families (name, slug, created_by) values (p_name, p_slug, auth.uid())
  returning id into fid;
  insert into public.family_members (family_id, user_id, role) values (fid, auth.uid(), 'admin');
  update public.profiles set active_family_id = fid, updated_at = now() where id = auth.uid();
  return fid;
end $$;

-- RPC: accept invite by code (validates and joins)
create or replace function public.accept_invite(p_code text)
returns uuid
language plpgsql security definer as $$
declare rec public.family_invites%rowtype;
begin
  select * into rec from public.family_invites
   where code = p_code and status='pending' and expires_at > now()
   for update;
  if not found then
    raise exception 'Invalid or expired code';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (rec.family_id, auth.uid(), 'member')
  on conflict (family_id, user_id) do update set status='active';

  update public.family_invites set status='accepted' where id = rec.id;
  update public.profiles set active_family_id = rec.family_id, updated_at = now() where id = auth.uid();
  return rec.family_id;
end $$;

-- RLS enable
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;

-- Profiles: user can read/update self
create policy if not exists "profiles read own" on public.profiles for select using (id = auth.uid());
create policy if not exists "profiles update own" on public.profiles for update using (id = auth.uid());

-- Families: members can select; creator inserts
create policy if not exists "families select members" on public.families for select using (public.is_family_member(id));
create policy if not exists "families insert creator" on public.families for insert with check (created_by = auth.uid());

-- Members: visible to family members
create policy if not exists "members select family" on public.family_members for select using (public.is_family_member(family_id));

-- Invites: family members can read/insert; invited email can read its row
create policy if not exists "invites read" on public.family_invites
for select using (public.is_family_member(family_id) or (email = auth.email()));
create policy if not exists "invites insert by members" on public.family_invites
for insert with check (public.is_family_member(family_id));

-- Trigger: auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'name',''));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();
