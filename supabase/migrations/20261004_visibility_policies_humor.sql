begin;

-- 원본 테이블에서 숨긴 한마디 조회 제한
drop policy if exists "Restrict hidden humor caption visibility"
on public.humor_captions;

create policy "Restrict hidden humor caption visibility"
on public.humor_captions
as restrictive
for select
to anon, authenticated
using (
  is_hidden = false
  or (select public.is_current_user_admin())
);

-- 공개용 View에서 숨긴 한마디 제외
create or replace view public.humor_caption_feed
with (security_barrier = true)
as
select
  captions.id,
  captions.prompt_id,
  captions.content,
  captions.created_at,
  captions.updated_at,
  ((select auth.uid()) = captions.user_id) as is_own,

  case
    when prompts.ends_at <= now()
      then profiles.nickname
    else null
  end as author_nickname,

  coalesce(sum(ratings.score), 0)::bigint as total_score,

  count(ratings.id)::bigint as rating_count,

  max(ratings.score) filter (
    where ratings.user_id = (select auth.uid())
  ) as current_user_score

from public.humor_captions as captions

join public.humor_prompts as prompts
  on prompts.id = captions.prompt_id

left join public.profiles as profiles
  on profiles.id = captions.user_id

left join public.humor_caption_ratings as ratings
  on ratings.caption_id = captions.id

where prompts.starts_at <= now()
  and captions.is_hidden = false

group by
  captions.id,
  captions.prompt_id,
  captions.user_id,
  captions.content,
  captions.created_at,
  captions.updated_at,
  prompts.ends_at,
  profiles.nickname;

revoke all
on table public.humor_caption_feed
from public, anon, authenticated;

grant select
on table public.humor_caption_feed
to anon, authenticated;

-- 숨긴 한마디의 별점 평가 차단
create or replace function public.can_rate_humor_caption(
  target_caption_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.humor_captions as captions
    join public.humor_prompts as prompts
      on prompts.id = captions.prompt_id
    where captions.id = target_caption_id
      and captions.is_hidden = false
      and captions.user_id <> (select auth.uid())
      and prompts.starts_at <= now()
      and prompts.ends_at > now()
  );
$$;

revoke all
on function public.can_rate_humor_caption(bigint)
from public, anon, authenticated;

grant execute
on function public.can_rate_humor_caption(bigint)
to authenticated;

commit;