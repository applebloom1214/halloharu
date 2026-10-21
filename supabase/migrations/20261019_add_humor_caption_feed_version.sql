begin;

alter table public.humor_prompts
add column if not exists caption_feed_version bigint
not null default 0;

create or replace function public.bump_humor_caption_feed_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_prompt_ids bigint[];
  affected_caption_ids bigint[];
begin
  if tg_table_name = 'humor_captions' then
    if tg_op = 'INSERT' then
      affected_prompt_ids := array[new.prompt_id];
    elsif tg_op = 'UPDATE' then
      affected_prompt_ids := array[old.prompt_id, new.prompt_id];
    else
      affected_prompt_ids := array[old.prompt_id];
    end if;

  elsif tg_table_name = 'humor_caption_ratings' then
    if tg_op = 'INSERT' then
      affected_caption_ids := array[new.caption_id];
    elsif tg_op = 'UPDATE' then
      affected_caption_ids := array[old.caption_id, new.caption_id];
    else
      affected_caption_ids := array[old.caption_id];
    end if;

    select array_agg(distinct captions.prompt_id)
    into affected_prompt_ids
    from public.humor_captions as captions
    where captions.id = any(affected_caption_ids);

  else
    raise exception '지원하지 않는 테이블입니다.';
  end if;

  update public.humor_prompts
  set caption_feed_version = caption_feed_version + 1
  where id = any(affected_prompt_ids);

  return null;
end;
$$;

revoke all
on function public.bump_humor_caption_feed_version()
from public, anon, authenticated;

create or replace trigger bump_feed_version_on_caption_change
after insert or update or delete
on public.humor_captions
for each row
execute function public.bump_humor_caption_feed_version();

create or replace trigger bump_feed_version_on_rating_change
after insert or update or delete
on public.humor_caption_ratings
for each row
execute function public.bump_humor_caption_feed_version();

commit;