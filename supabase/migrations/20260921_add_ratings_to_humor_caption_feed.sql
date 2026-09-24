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
from anon, authenticated;

grant select
on table public.humor_caption_feed
to anon, authenticated;