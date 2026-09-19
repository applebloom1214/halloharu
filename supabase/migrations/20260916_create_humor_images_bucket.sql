insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'humor-images',
  'humor-images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload humor images"
on storage.objects;

drop policy if exists "Admins can delete humor images"
on storage.objects;

create policy "Admins can upload humor images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'humor-images'
  and exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);

create policy "Admins can delete humor images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'humor-images'
  and exists (
    select 1
    from public.admins
    where admins.user_id = (select auth.uid())
  )
);