alter table public.posts
add column user_id uuid
references auth.users(id)
on delete cascade;