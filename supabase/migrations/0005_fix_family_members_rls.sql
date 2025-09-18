-- Fix RLS policies for family_members table
-- Allow users to insert themselves as members when they have an active_family_id

-- Add INSERT policy for family_members
create policy if not exists "members insert self" on public.family_members
for insert with check (
  user_id = auth.uid() and 
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and active_family_id = family_members.family_id
  )
);

-- Add UPDATE policy for family_members (for role changes)
create policy if not exists "members update self" on public.family_members
for update using (
  user_id = auth.uid() and 
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and active_family_id = family_members.family_id
  )
);

-- Also allow family creators to manage members
create policy if not exists "members insert by creator" on public.family_members
for insert with check (
  exists (
    select 1 from public.families 
    where id = family_members.family_id and created_by = auth.uid()
  )
);

create policy if not exists "members update by creator" on public.family_members
for update using (
  exists (
    select 1 from public.families 
    where id = family_members.family_id and created_by = auth.uid()
  )
);

-- RPC function to create family invites (bypasses RLS)
create or replace function public.create_family_invite(
  p_family_id uuid,
  p_email text,
  p_code text,
  p_invited_by uuid
)
returns uuid
language plpgsql security definer as $$
declare
  invite_id uuid;
begin
  -- Verify the inviter is a member of the family
  if not exists (
    select 1 from public.profiles 
    where id = p_invited_by and active_family_id = p_family_id
  ) then
    raise exception 'User is not a member of this family';
  end if;

  -- Insert the invite
  insert into public.family_invites (
    family_id, email, code, invited_by, status, expires_at
  ) values (
    p_family_id, p_email, p_code, p_invited_by, 'pending', 
    now() + interval '14 days'
  ) returning id into invite_id;
  
  return invite_id;
end $$;
