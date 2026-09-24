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
      and captions.user_id <> (select auth.uid())
      and prompts.starts_at <= now()
      and prompts.ends_at > now()
  );
$$;

revoke all
on function public.can_rate_humor_caption(bigint)
from public;

grant execute
on function public.can_rate_humor_caption(bigint)
to authenticated;

revoke update
on table public.humor_caption_ratings
from authenticated;

grant update (score, updated_at)
on table public.humor_caption_ratings
to authenticated;

create policy "Users can read own humor ratings"
on public.humor_caption_ratings
for select
to authenticated
using (
  user_id = (select auth.uid())
);

create policy "Users can insert own humor ratings"
on public.humor_caption_ratings
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.can_rate_humor_caption(caption_id)
);

create policy "Users can update own active humor ratings"
on public.humor_caption_ratings
for update
to authenticated
using (
  user_id = (select auth.uid())
  and public.can_rate_humor_caption(caption_id)
)
with check (
  user_id = (select auth.uid())
  and public.can_rate_humor_caption(caption_id)
);

create policy "Users can delete own active humor ratings"
on public.humor_caption_ratings
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and public.can_rate_humor_caption(caption_id)
);