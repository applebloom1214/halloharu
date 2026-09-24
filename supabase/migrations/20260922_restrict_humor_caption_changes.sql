drop policy if exists "Users can update own active humor caption"
on public.humor_captions;

revoke update
on table public.humor_captions
from authenticated;

drop policy if exists "Users can delete own humor caption"
on public.humor_captions;

create policy "Users can delete own active humor caption"
on public.humor_captions
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.humor_prompts
    where humor_prompts.id = humor_captions.prompt_id
      and humor_prompts.starts_at <= now()
      and humor_prompts.ends_at > now()
  )
);