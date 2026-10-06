-- A person's own profile: phone, job title and a photo, editable by that person
-- and nobody else (the admin flag and the email stay out of reach: only the
-- columns granted below can be updated through the API).

alter table public.profiles
  add column phone     text,
  add column job_title text,
  add column avatar_path text,
  add constraint profiles_phone_len     check (phone is null or char_length(phone) <= 30),
  add constraint profiles_job_title_len check (job_title is null or char_length(job_title) <= 60),
  add constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 80),
  -- the photo must be a file inside the person's own folder of the avatars bucket
  add constraint profiles_avatar_path_own check (
    avatar_path is null
    or (avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,100}$' and left(avatar_path, 36) = id::text)
  );

grant update (full_name, phone, job_title, avatar_path) on public.profiles to authenticated;

-- ── storage: profile photos ────────────────────────────────────────────────
-- Public read (they are shown to the person's teammates and in the page header);
-- each person may only write inside their own folder: <user_id>/<file>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
