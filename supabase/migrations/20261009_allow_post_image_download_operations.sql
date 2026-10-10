begin;

-- 사진 다운로드 및 관련 정보 조회 작업 허용
alter policy "Anyone can download visible post images"
on storage.objects
using (
  bucket_id = 'post-images'
  and storage.allow_any_operation(
    array[
      'object.get_authenticated',
      'object.get_authenticated_info'
    ]
  )
  and exists (
    select 1
    from public.posts
    where posts.image_path = storage.objects.name
      and posts.user_id::text = storage.objects.owner_id
      and posts.is_hidden = false
  )
);

commit;