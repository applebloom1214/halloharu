drop policy if exists "Anyone can create posts"
on public.posts;

alter table public.posts
enable row level security;

revoke insert
on table public.posts
from anon;

grant insert
on table public.posts
to authenticated;

create policy "Authenticated users can create own posts"
on public.posts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);