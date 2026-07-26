grant update
on table public.posts
to anon, authenticated;

create policy "Anyone can update posts"
on public.posts
for update
to anon, authenticated
using (true)
with check(
    char_length(content) between 1 and 300
);