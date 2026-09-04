create table if not exists public.comments (
  id bigint
    generated always as identity
    primary key,

  post_id bigint
    not null
    references public.posts(id)
    on delete cascade,

  user_id uuid
    not null
    references public.profiles(id)
    on delete cascade,

  content text
    not null
    check (char_length(btrim(content)) between 1 and 200),

  created_at timestamptz
    not null
    default now()
);

create index if not exists comments_post_id_created_at_index
on public.comments (post_id, created_at);

alter table public.comments
enable row level security;