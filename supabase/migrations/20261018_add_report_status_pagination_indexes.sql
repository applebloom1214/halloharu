create index if not exists reports_status_created_at_target_index
on public.reports (
  status,
  created_at desc,
  post_id desc,
  reporter_id asc
);

create index if not exists comment_reports_status_created_at_target_index
on public.comment_reports (
  status,
  created_at desc,
  comment_id desc,
  reporter_id asc
);

create index if not exists humor_caption_reports_status_created_at_target_index
on public.humor_caption_reports (
  status,
  created_at desc,
  caption_id desc,
  reporter_id asc
);