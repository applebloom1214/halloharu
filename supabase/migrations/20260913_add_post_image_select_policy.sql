drop policy if exists "Users can read own post images"
on storage.objects;

create policy "Users can read own post images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'post-images'
  and owner_id = (select auth.uid()::text)
);