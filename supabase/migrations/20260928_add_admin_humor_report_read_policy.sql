create policy "Admins can read all humor caption reports"
on public.humor_caption_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);