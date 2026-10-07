begin;

create or replace function public.get_own_humor_caption_status(
  target_prompt_id bigint
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select
        case
          when captions.is_hidden then 'hidden'
          else 'visible'
        end
      from public.humor_captions as captions
      where captions.prompt_id = target_prompt_id
        and captions.user_id = (select auth.uid())
    ),
    'none'
  );
$$;

revoke all
on function public.get_own_humor_caption_status(bigint)
from public, anon, authenticated;

grant execute
on function public.get_own_humor_caption_status(bigint)
to authenticated;

commit;