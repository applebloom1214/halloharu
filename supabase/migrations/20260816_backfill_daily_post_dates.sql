with ranked_posts as (
  select
    id,
    (created_at at time zone 'Asia/Seoul')::date as post_date,
    row_number() over (
      partition by
        user_id,
        (created_at at time zone 'Asia/Seoul')::date
      order by
        created_at asc,
        id asc
    ) as position
  from public.posts
  where user_id is not null
)
update public.posts as posts
set daily_post_date = ranked_posts.post_date
from ranked_posts
where posts.id = ranked_posts.id
  and ranked_posts.position = 1
  and posts.daily_post_date is null;