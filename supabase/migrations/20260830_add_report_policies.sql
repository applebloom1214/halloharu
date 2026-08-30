revoke all
on table public.reports
from anon, authenticated;

grant select, insert
on table public.reports
to authenticated;

create policy "Users can read own reports"
on public.reports
for select
to authenticated
using ((select auth.uid()) = reporter_id);

create policy "Users can report other users posts"
on public.reports
for insert
to authenticated
with check (
  (select auth.uid()) = reporter_id
  and exists (
    select 1
    from public.posts
    where posts.id = reports.post_id
      and posts.user_id is distinct from (select auth.uid())
  )
);