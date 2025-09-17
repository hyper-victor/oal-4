-- POSTS
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists posts_family_created_idx on public.posts(family_id, created_at desc);

-- EVENTS
create type if not exists public.rsvp_status as enum ('going','maybe','not_responded');
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists events_family_starts_idx on public.events(family_id, starts_at);

-- EVENT RSVPS
create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.rsvp_status not null default 'not_responded',
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Helper: is admin?
create or replace function public.is_family_admin(target_family uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.family_members
    where family_id = target_family and user_id = auth.uid() and role = 'admin' and status='active'
  );
$$;

-- RLS
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- POSTS policies
create policy if not exists "posts select for members"
  on public.posts for select using (public.is_family_member(family_id));
create policy if not exists "posts insert by members"
  on public.posts for insert with check (public.is_family_member(family_id) and author_id = auth.uid());
create policy if not exists "posts update by author or admin"
  on public.posts for update using (author_id = auth.uid() or public.is_family_admin(family_id));
create policy if not exists "posts delete by author or admin"
  on public.posts for delete using (author_id = auth.uid() or public.is_family_admin(family_id));

-- EVENTS policies
create policy if not exists "events select for members"
  on public.events for select using (public.is_family_member(family_id));
create policy if not exists "events insert by members"
  on public.events for insert with check (public.is_family_member(family_id) and created_by = auth.uid());
create policy if not exists "events update by creator or admin"
  on public.events for update using (created_by = auth.uid() or public.is_family_admin(family_id));
create policy if not exists "events delete by creator or admin"
  on public.events for delete using (created_by = auth.uid() or public.is_family_admin(family_id));

-- RSVPS policies (members of the event's family only)
create policy if not exists "rsvps select for event family members"
  on public.event_rsvps for select using (
    exists (select 1 from public.events e where e.id = event_id and public.is_family_member(e.family_id))
  );
create policy if not exists "rsvps upsert by event family members"
  on public.event_rsvps for insert with check (
    exists (select 1 from public.events e where e.id = event_id and public.is_family_member(e.family_id)) and user_id = auth.uid()
  );
create policy if not exists "rsvps update by self"
  on public.event_rsvps for update using (user_id = auth.uid());

-- Trigger to keep updated_at fresh on RSVPS
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists trg_rsvps_touch on public.event_rsvps;
create trigger trg_rsvps_touch before update on public.event_rsvps
for each row execute procedure public.touch_updated_at();

-- END 0002
