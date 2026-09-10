create policy "Admins can read all reports"
on public.reports
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);