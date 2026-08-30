create table public.reports (
  post_id bigint
    not null
    references public.posts(id)
    on delete cascade,

  reporter_id uuid
    not null
    references auth.users(id)
    on delete cascade,

  reason text
    not null
    check (reason in ('spam', 'harassment', 'inappropriate', 'other')),

  created_at timestamptz
    not null
    default now(),

  primary key (post_id, reporter_id)
);

alter table public.reports enable row level security;