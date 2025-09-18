-- Create event invitations table
create table if not exists public.event_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, invited_user_id)
);

-- Create indexes for better performance
create index if not exists event_invitations_event_id_idx on public.event_invitations(event_id);
create index if not exists event_invitations_invited_user_id_idx on public.event_invitations(invited_user_id);
create index if not exists event_invitations_status_idx on public.event_invitations(status);

-- Enable RLS
alter table public.event_invitations enable row level security;

-- RLS Policies for event invitations
create policy "Users can view invitations for events in their family" on public.event_invitations
  for select using (
    exists (
      select 1 from public.events e
      join public.profiles p on p.active_family_id = e.family_id
      where e.id = event_invitations.event_id
      and p.id = auth.uid()
    )
  );

create policy "Users can create invitations for events in their family" on public.event_invitations
  for insert with check (
    exists (
      select 1 from public.events e
      join public.profiles p on p.active_family_id = e.family_id
      where e.id = event_invitations.event_id
      and p.id = auth.uid()
    )
  );

create policy "Users can update their own invitations" on public.event_invitations
  for update using (invited_user_id = auth.uid());

-- Create event updates table for comments/announcements
create table if not exists public.event_updates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for event updates
create index if not exists event_updates_event_id_idx on public.event_updates(event_id);
create index if not exists event_updates_author_id_idx on public.event_updates(author_id);
create index if not exists event_updates_created_at_idx on public.event_updates(created_at desc);

-- Enable RLS for event updates
alter table public.event_updates enable row level security;

-- RLS Policies for event updates
create policy "Users can view updates for events in their family" on public.event_updates
  for select using (
    exists (
      select 1 from public.events e
      join public.profiles p on p.active_family_id = e.family_id
      where e.id = event_updates.event_id
      and p.id = auth.uid()
    )
  );

create policy "Users can create updates for events in their family" on public.event_updates
  for insert with check (
    exists (
      select 1 from public.events e
      join public.profiles p on p.active_family_id = e.family_id
      where e.id = event_updates.event_id
      and p.id = auth.uid()
      and event_updates.author_id = auth.uid()
    )
  );

create policy "Users can update their own event updates" on public.event_updates
  for update using (author_id = auth.uid());

create policy "Users can delete their own event updates" on public.event_updates
  for delete using (author_id = auth.uid());

-- END 0004
