create table public.humor_caption_reports (
  caption_id bigint
    not null
    references public.humor_captions(id)
    on delete cascade,

  reporter_id uuid
    not null
    references auth.users(id)
    on delete cascade,

  reason text
    not null
    check (reason in ('spam', 'harassment', 'inappropriate', 'other')),

  status text
    not null
    default 'pending'
    check (status in ('pending', 'resolved', 'dismissed')),

  created_at timestamptz
    not null
    default now(),

  primary key (caption_id, reporter_id)
);

alter table public.humor_caption_reports
enable row level security;

revoke all
on table public.humor_caption_reports
from anon, authenticated;