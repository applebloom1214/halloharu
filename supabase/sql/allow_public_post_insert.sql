grant insert
on table public.posts
to anon, authenticated;

create policy "Anyone can create posts"
on public.posts
for insert
to anon, authenticated
with check(
    char_length(content) between 1 and 300
    and empathy_count = 0
    and cheer_count = 0
    and smile_count = 0
);

