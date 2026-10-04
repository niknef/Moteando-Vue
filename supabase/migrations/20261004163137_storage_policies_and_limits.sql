drop policy if exists "posts_insert 1rma4z_0" on storage.objects;
drop policy if exists "posts_select 1rma4z_0" on storage.objects;
drop policy if exists "posts_update 1rma4z_0" on storage.objects;
drop policy if exists "posts_delete 1rma4z_0" on storage.objects;

create policy "posts insert own folder" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "posts update own folder" on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'posts'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

create policy "posts delete own folder" on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'posts'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

create policy "posts select own folder" on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'posts'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

update storage.buckets
set file_size_limit = 1048576,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('avatars', 'bikes', 'posts');
