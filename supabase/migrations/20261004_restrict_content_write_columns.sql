begin;

-- 테이블 전체에 부여된 작성·수정 권한 회수
revoke insert, update
on table
  public.posts,
  public.comments,
  public.humor_captions
from public, anon, authenticated;

-- 게시글 작성에 필요한 컬럼
grant insert (user_id, content, comments_enabled, image_path)
on table public.posts
to authenticated;

-- 게시글 내용 수정
grant update (content)
on table public.posts
to authenticated;

-- 댓글 작성에 필요한 컬럼
grant insert (post_id, user_id, content)
on table public.comments
to authenticated;

-- 댓글 내용 수정
grant update (content)
on table public.comments
to authenticated;

-- 유머 한마디 작성에 필요한 컬럼
grant insert (prompt_id, user_id, content)
on table public.humor_captions
to authenticated;

commit;