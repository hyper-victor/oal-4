-- POST COMMENTS
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists post_comments_post_created_idx on public.post_comments(post_id, created_at desc);

-- POST LIKES
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_likes_post_created_idx on public.post_likes(post_id, created_at desc);

-- RLS
alter table public.post_comments enable row level security;
alter table public.post_likes enable row level security;

-- POST COMMENTS policies
create policy if not exists "post_comments select for post family members"
  on public.post_comments for select using (
    exists (
      select 1 from public.posts p 
      where p.id = post_id and public.is_family_member(p.family_id)
    )
  );
create policy if not exists "post_comments insert by post family members"
  on public.post_comments for insert with check (
    exists (
      select 1 from public.posts p 
      where p.id = post_id and public.is_family_member(p.family_id)
    ) and author_id = auth.uid()
  );
create policy if not exists "post_comments update by author or admin"
  on public.post_comments for update using (
    author_id = auth.uid() or 
    exists (
      select 1 from public.posts p 
      where p.id = post_id and public.is_family_admin(p.family_id)
    )
  );
create policy if not exists "post_comments delete by author or admin"
  on public.post_comments for delete using (
    author_id = auth.uid() or 
    exists (
      select 1 from public.posts p 
      where p.id = post_id and public.is_family_admin(p.family_id)
    )
  );

-- POST LIKES policies
create policy if not exists "post_likes select for post family members"
  on public.post_likes for select using (
    exists (
      select 1 from public.posts p 
      where p.id = post_id and public.is_family_member(p.family_id)
    )
  );
create policy if not exists "post_likes insert by post family members"
  on public.post_likes for insert with check (
    exists (
      select 1 from public.posts p 
      where p.id = post_id and public.is_family_member(p.family_id)
    ) and user_id = auth.uid()
  );
create policy if not exists "post_likes delete by self"
  on public.post_likes for delete using (user_id = auth.uid());

-- Trigger to keep updated_at fresh on comments
create or replace function public.touch_comment_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists trg_comments_touch on public.post_comments;
create trigger trg_comments_touch before update on public.post_comments
for each row execute procedure public.touch_comment_updated_at();

-- END 0006
