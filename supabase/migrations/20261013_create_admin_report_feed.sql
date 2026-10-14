create or replace view public.admin_report_feed
with (security_invoker = true)
as
select
  combined.kind,
  combined.target_id,
  combined.reporter_id,
  combined.reason,
  combined.status,
  combined.created_at
from (
  select
    'post'::text as kind,
    post_id as target_id,
    reporter_id,
    reason,
    status,
    created_at
  from public.reports

  union all

  select
    'comment'::text as kind,
    comment_id as target_id,
    reporter_id,
    reason,
    status,
    created_at
  from public.comment_reports

  union all

  select
    'humor'::text as kind,
    caption_id as target_id,
    reporter_id,
    reason,
    status,
    created_at
  from public.humor_caption_reports
) as combined
where exists (
  select 1
  from public.admins
  where admins.user_id = (select auth.uid())
);

revoke all
on table public.admin_report_feed
from public, anon, authenticated;

grant select
on table public.admin_report_feed
to authenticated;