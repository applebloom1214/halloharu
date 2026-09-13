drop policy if exists "Users can upload own post images"
on storage.objects;

drop policy if exists "Users can delete own post images"
on storage.objects;

create policy "Users can upload own post images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete own post images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'post-images'
  and owner_id = (select auth.uid()::text)
);