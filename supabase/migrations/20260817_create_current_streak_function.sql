create or replace function public.get_current_streak()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive
    recorded_dates as (
      select distinct posts.daily_post_date
      from public.posts
      where posts.user_id = auth.uid()
        and posts.daily_post_date is not null
    ),

    starting_day as (
      select
        case
          when exists (
            select 1
            from recorded_dates
            where daily_post_date =
              (current_timestamp at time zone 'Asia/Seoul')::date
          )
          then (current_timestamp at time zone 'Asia/Seoul')::date

          when exists (
            select 1
            from recorded_dates
            where daily_post_date =
              (current_timestamp at time zone 'Asia/Seoul')::date - 1
          )
          then (current_timestamp at time zone 'Asia/Seoul')::date - 1

          else null::date
        end as day
    ),

    streak(day) as (
      select day
      from starting_day
      where day is not null

      union all

      select streak.day - 1
      from streak
      where exists (
        select 1
        from recorded_dates
        where daily_post_date = streak.day - 1
      )
    )

  select count(*)::integer
  from streak;
$$;

revoke execute
on function public.get_current_streak()
from public;

grant execute
on function public.get_current_streak()
to authenticated;