create or replace view public.humor_caption_feed
with (security_barrier = true)
as
select
  captions.id,
  captions.prompt_id,
  captions.content,
  captions.created_at,
  captions.updated_at,
  ((select auth.uid()) = captions.user_id) as is_own
from public.humor_captions as captions
join public.humor_prompts as prompts
  on prompts.id = captions.prompt_id
where prompts.starts_at <= now();

revoke all
on table public.humor_caption_feed
from anon, authenticated;

grant select
on table public.humor_caption_feed
to anon, authenticated;

drop policy if exists "Anyone can read humor captions"
on public.humor_captions;

drop policy if exists "Users can read own humor caption"
on public.humor_captions;

drop policy if exists "Admins can read all humor captions"
on public.humor_captions;

create policy "Users can read own humor caption"
on public.humor_captions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can read all humor captions"
on public.humor_captions
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);

revoke select
on table public.humor_captions
from anon, authenticated;

grant select
on table public.humor_captions
to authenticated;