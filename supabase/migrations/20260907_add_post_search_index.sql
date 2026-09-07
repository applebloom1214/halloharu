create extension if not exists pg_trgm
with schema extensions;


create index if not exists posts_content_trgm_index
on public.posts
using gin (
  content extensions.gin_trgm_ops
);