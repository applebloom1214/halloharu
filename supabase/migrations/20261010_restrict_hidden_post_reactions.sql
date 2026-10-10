begin;

-- 숨겨지지 않은 게시글의 리액션만 조회 허용
alter policy "Anyone can read reactions"
on public.reactions
using (
  exists (
    select 1
    from public.posts
    where posts.id = reactions.post_id
      and posts.is_hidden = false
  )
);

-- 본인 리액션이며, 숨겨지지 않은 게시글일 때만 등록 허용
alter policy "Users can create own reactions"
on public.reactions
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.posts
    where posts.id = reactions.post_id
      and posts.is_hidden = false
  )
);

-- 본인 리액션이며, 숨겨지지 않은 게시글일 때만 삭제 허용
alter policy "Users can delete own reactions"
on public.reactions
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.posts
    where posts.id = reactions.post_id
      and posts.is_hidden = false
  )
);

commit;