alter table public.reactions
enable row level security;

revoke insert, update, delete
on table public.reactions
from anon;

grant select
on table public.reactions
to anon, authenticated;

grant insert, delete
on table public.reactions
to authenticated;

create policy "Anyone can read reactions"
on public.reactions
for select
to anon, authenticated
using (true);

create policy "Users can create own reactions"
on public.reactions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Users can delete own reactions"
on public.reactions
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);