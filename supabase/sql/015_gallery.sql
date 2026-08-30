-- 자유 사진 갤러리(체크인과 별도, 전체 모둠 통합 조회).
-- 001~014 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.
-- Storage 버킷 gallery-photos는 대시보드에서 직접 생성해야 함(Public, checkin-photos와 동일 설정).

create extension if not exists pgcrypto;

create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  group_name text not null,
  uploader_name text not null,
  photo_path text not null,
  delete_password_hash text not null,
  created_at timestamptz not null default now()
);

alter table gallery_photos enable row level security;

-- 전체 공개 조회 (모둠 통합 조회) — announcements/emergency_contacts와 동일 패턴.
create policy public_read_gallery_photos on gallery_photos for select using (true);

create policy teacher_all_gallery_photos on gallery_photos for all using (is_teacher()) with check (is_teacher());

-- 모둠장은 자기 모둠이 올린 사진만 비밀번호 없이 삭제 가능 (leader_delete_own_timetable과 동일 패턴).
create policy leader_delete_own_gallery_photos on gallery_photos for delete using (
  exists (select 1 from groups g join auth_accounts aa on aa.id = g.auth_account_id
    where g.id = gallery_photos.group_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1))
);

-- 접속코드로 사진 업로드 기록 (일반 학생/모둠장 공용). 비밀번호는 해시로만 저장.
create or replace function add_gallery_photo(
  p_access_code text, p_photo_path text, p_password text, p_name text
) returns uuid
language plpgsql security definer
as $$
declare v_group_id uuid; v_group_name text; v_photo_id uuid;
begin
  select id, name into v_group_id, v_group_name from groups where access_code = p_access_code;
  if v_group_id is null then
    raise exception 'invalid access code';
  end if;

  insert into gallery_photos (group_id, group_name, uploader_name, photo_path, delete_password_hash)
  values (v_group_id, v_group_name, p_name, p_photo_path, crypt(p_password, gen_salt('bf')))
  returning id into v_photo_id;
  return v_photo_id;
end;
$$;
grant execute on function add_gallery_photo(text, text, text, text) to anon;

-- 접속코드 + 비밀번호가 맞을 때만 삭제 (일반 학생용 — 모둠장/교사는 위 RLS로 직접 삭제).
create or replace function delete_gallery_photo(
  p_access_code text, p_photo_id uuid, p_password text
) returns void
language plpgsql security definer
as $$
declare v_group_id uuid; v_photo_group_id uuid; v_hash text;
begin
  select id into v_group_id from groups where access_code = p_access_code;
  if v_group_id is null then
    raise exception 'invalid access code';
  end if;

  select group_id, delete_password_hash into v_photo_group_id, v_hash from gallery_photos where id = p_photo_id;
  if v_photo_group_id is distinct from v_group_id then
    raise exception 'photo does not belong to this group';
  end if;
  if v_hash is distinct from crypt(p_password, v_hash) then
    raise exception 'incorrect password';
  end if;

  delete from gallery_photos where id = p_photo_id;
end;
$$;
grant execute on function delete_gallery_photo(text, uuid, text) to anon;

-- Storage RLS (checkin-photos 버킷과 동일하게 버킷 단위 검사만).
create policy public_read_gallery_bucket on storage.objects for select
  using (bucket_id = 'gallery-photos');
create policy anon_upload_gallery_bucket on storage.objects for insert
  with check (bucket_id = 'gallery-photos');
create policy anon_delete_gallery_bucket on storage.objects for delete
  using (bucket_id = 'gallery-photos');
