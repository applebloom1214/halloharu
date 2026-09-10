create table public.admins (
  user_id uuid
    primary key
    references auth.users(id)
    on delete cascade,

  created_at timestamptz
    not null
    default now()
);

alter table public.admins enable row level security;

revoke all
on table public.admins
from anon, authenticated;

grant select
on table public.admins
to authenticated;

create policy "Users can check own admin status"
on public.admins
for select
to authenticated
using ((select auth.uid()) = user_id);