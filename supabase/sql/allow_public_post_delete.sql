grant delete
on table public.posts
to anon, authenticated;

create policy "Anyone can delete posts"
on public.posts
for delete
to anon, authenticated
using (true);