begin;

create or replace function public.set_daily_post_date()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.daily_post_date :=
    (current_timestamp at time zone 'Asia/Seoul')::date;

  return new;
end;
$$;

drop trigger if exists set_daily_post_date_before_insert
on public.posts;

create trigger set_daily_post_date_before_insert
before insert
on public.posts
for each row
execute function public.set_daily_post_date();

create unique index if not exists
  posts_user_daily_post_date_unique
on public.posts (
  user_id,
  daily_post_date
)
where daily_post_date is not null;

commit;