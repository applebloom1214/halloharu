drop policy if exists "Anyone can update posts"
on public.posts;

drop policy if exists "Anyone can delete posts"
on public.posts;

alter table public.posts
enable row level security;

revoke update, delete
on table public.posts
from anon;

grant update, delete
on table public.posts
to authenticated;

create policy "Authors can update own posts"
on public.posts
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy "Authors can delete own posts"
on public.posts
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);