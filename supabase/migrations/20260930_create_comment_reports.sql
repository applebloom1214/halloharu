create table public.comment_reports (
  comment_id bigint
    not null
    references public.comments(id)
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

  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,

  primary key (comment_id, reporter_id)
);

alter table public.comment_reports
enable row level security;

revoke all
on table public.comment_reports
from anon, authenticated;


grant select, insert
on table public.comment_reports
to authenticated;

create policy "Users can read own comment reports"
on public.comment_reports
for select
to authenticated
using (reporter_id = (select auth.uid()));

create policy "Users can report other comments"
on public.comment_reports
for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and exists (
    select 1
    from public.comments as target_comment
    where target_comment.id = comment_reports.comment_id
      and target_comment.user_id <> (select auth.uid())
  )
);

grant update (status, reviewed_at, reviewed_by)
on table public.comment_reports
to authenticated;

create policy "Admins can read all comment reports"
on public.comment_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);

create policy "Admins can update comment reports"
on public.comment_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);