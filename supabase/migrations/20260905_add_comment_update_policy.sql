grant update (content)
on table public.comments
to authenticated;


create policy "Users can update own comments"
on public.comments
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);