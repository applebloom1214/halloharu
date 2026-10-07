begin;

-- 현재 사용자의 관리자 여부 확인
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  );
$$;

revoke all
on function public.is_current_user_admin()
from public, anon, authenticated;

grant execute
on function public.is_current_user_admin()
to anon, authenticated;

-- 게시글 조회 제한
drop policy if exists "Restrict hidden post visibility"
on public.posts;

create policy "Restrict hidden post visibility"
on public.posts
as restrictive
for select
to anon, authenticated
using (
  is_hidden = false
  or (select public.is_current_user_admin())
);

-- 댓글 조회 제한
drop policy if exists "Restrict hidden comment visibility"
on public.comments;

create policy "Restrict hidden comment visibility"
on public.comments
as restrictive
for select
to anon, authenticated
using (
  (
    is_hidden = false
    and exists (
      select 1
      from public.posts
      where posts.id = comments.post_id
        and posts.is_hidden = false
    )
  )
  or (select public.is_current_user_admin())
);

commit;