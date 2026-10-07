begin;

-- 기존 조치 완료 게시글 숨김
update public.posts as target
set
  is_hidden = true,
  hidden_at = coalesce(resolved.reviewed_at, now()),
  hidden_by = resolved.reviewed_by
from (
  select distinct on (post_id)
    post_id,
    reviewed_at,
    reviewed_by
  from public.reports
  where status = 'resolved'
  order by
    post_id,
    reviewed_at desc nulls last,
    created_at desc,
    reporter_id
) as resolved
where target.id = resolved.post_id
  and target.is_hidden = false;

-- 기존 조치 완료 댓글 숨김
update public.comments as target
set
  is_hidden = true,
  hidden_at = coalesce(resolved.reviewed_at, now()),
  hidden_by = resolved.reviewed_by
from (
  select distinct on (comment_id)
    comment_id,
    reviewed_at,
    reviewed_by
  from public.comment_reports
  where status = 'resolved'
  order by
    comment_id,
    reviewed_at desc nulls last,
    created_at desc,
    reporter_id
) as resolved
where target.id = resolved.comment_id
  and target.is_hidden = false;

-- 기존 조치 완료 유머 한마디 숨김
update public.humor_captions as target
set
  is_hidden = true,
  hidden_at = coalesce(resolved.reviewed_at, now()),
  hidden_by = resolved.reviewed_by
from (
  select distinct on (caption_id)
    caption_id,
    reviewed_at,
    reviewed_by
  from public.humor_caption_reports
  where status = 'resolved'
  order by
    caption_id,
    reviewed_at desc nulls last,
    created_at desc,
    reporter_id
) as resolved
where target.id = resolved.caption_id
  and target.is_hidden = false;

commit;