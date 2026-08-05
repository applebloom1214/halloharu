alter table public.posts
  drop column if exists empathy_count,
  drop column if exists cheer_count,
  drop column if exists smile_count;