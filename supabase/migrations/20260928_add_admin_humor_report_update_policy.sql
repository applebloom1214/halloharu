alter table public.humor_caption_reports
add column reviewed_at timestamptz,
add column reviewed_by uuid
  references auth.users(id)
  on delete set null;

grant update (status, reviewed_at, reviewed_by)
on table public.humor_caption_reports
to authenticated;

create policy "Admins can update humor caption reports"
on public.humor_caption_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);