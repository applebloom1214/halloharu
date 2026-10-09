begin;

-- 기존의 작성자 전용 조회 정책 제거
drop policy if exists "Users can read own post images"
on storage.objects;

-- 숨겨지지 않은 게시글의 첨부 사진 다운로드 허용
drop policy if exists "Anyone can download visible post images"
on storage.objects;

create policy "Anyone can download visible post images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'post-images'
  and storage.allow_only_operation('object.get_authenticated')
  and exists (
    select 1
    from public.posts
    where posts.image_path = storage.objects.name
      and posts.user_id::text = storage.objects.owner_id
      and posts.is_hidden = false
  )
);

-- 본인 사진을 삭제할 때 필요한 조회 권한
drop policy if exists "Users can select own post images for deletion"
on storage.objects;

create policy "Users can select own post images for deletion"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'post-images'
  and owner_id = (select auth.uid()::text)
  and storage.allow_only_operation('object.delete_many')
);

commit;