alter table public.posts
add column if not exists comments_enabled boolean
not null
default false;