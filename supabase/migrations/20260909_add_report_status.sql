alter table public.reports
add column status text
  not null
  default 'pending'
  check (status in ('pending', 'resolved', 'dismissed')),

add column reviewed_at timestamptz,

add column reviewed_by uuid
  references auth.users(id)
  on delete set null;

grant update (status, reviewed_at, reviewed_by)
on table public.reports
to authenticated;

create policy "Admins can update reports"
on public.reports
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