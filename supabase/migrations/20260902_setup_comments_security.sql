revoke all
on table public.comments
from anon, authenticated;

grant select
on table public.comments
to anon, authenticated;

grant insert, delete
on table public.comments
to authenticated;

revoke all
on sequence public.comments_id_seq
from anon, authenticated;

grant usage
on sequence public.comments_id_seq
to authenticated;


create policy "Anyone can read comments"
on public.comments
for select
to anon, authenticated
using (true);


create policy "Users can insert own comments"
on public.comments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.posts
    where posts.id = comments.post_id
      and posts.comments_enabled = true
  )
);


create policy "Comment or post authors can delete comments"
on public.comments
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.posts
    where posts.id = comments.post_id
      and posts.user_id = (select auth.uid())
  )
);