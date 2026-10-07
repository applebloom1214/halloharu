begin;

create or replace function public.has_posted_today()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts
    where posts.user_id = (select auth.uid())
      and posts.daily_post_date =
        (current_timestamp at time zone 'Asia/Seoul')::date
  );
$$;

revoke all
on function public.has_posted_today()
from public, anon, authenticated;

grant execute
on function public.has_posted_today()
to authenticated;

commit;