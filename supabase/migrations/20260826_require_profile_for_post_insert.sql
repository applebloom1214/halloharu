drop policy if exists "Authenticated users can create own posts"
on public.posts;

create policy "Authenticated users can create own posts"
on public.posts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);