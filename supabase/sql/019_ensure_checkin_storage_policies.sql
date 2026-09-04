-- checkin-photos 버킷 정책을 다시(안전하게) 보장한다.
-- 배경: 002_rls.sql에 정의된 public_read_checkin_photos(SELECT) 정책이 실제 운영 DB에는
-- 누락되어 있었다(2026-09-04 발견). 이 프로젝트는 checkin.js에서 사진 업로드 시 항상
-- upsert:true를 쓰는데, PostgreSQL은 "INSERT ... ON CONFLICT DO UPDATE"(upsert가 내부적으로
-- 이렇게 처리됨) 실행 시 충돌 여부를 확인하기 위해 대상 테이블에 SELECT 권한(=SELECT RLS
-- 정책 통과)을 요구한다 — 실제로 충돌이 나든 안 나든, upsert라는 이유만으로 항상 필요하다.
-- 그래서 SELECT 정책이 없으면 "최초 체크인"까지도 "new row violates row-level security
-- policy"로 막혔다(재체크인만의 문제가 아니었음). gallery.js는 upsert를 쓰지 않아 이 문제가
-- 없었고, 그래서 갤러리 업로드만 정상 작동했다.
--
-- 이 프로젝트는 CLI 마이그레이션이 아니라 SQL 에디터에 수동 실행하는 방식이라 정책 파일이
-- 실제 DB에 누락되는 사고가 재발할 수 있다. drop-if-exists 후 재생성해 몇 번을 실행해도
-- 안전하게(멱등) 만든다.

drop policy if exists public_read_checkin_photos on storage.objects;
create policy public_read_checkin_photos on storage.objects for select
  using (bucket_id = 'checkin-photos');

drop policy if exists anon_upload_checkin_photos on storage.objects;
create policy anon_upload_checkin_photos on storage.objects for insert
  with check (bucket_id = 'checkin-photos');

drop policy if exists anon_update_checkin_photos on storage.objects;
create policy anon_update_checkin_photos on storage.objects for update
  using (bucket_id = 'checkin-photos')
  with check (bucket_id = 'checkin-photos');

drop policy if exists anon_delete_checkin_photos on storage.objects;
create policy anon_delete_checkin_photos on storage.objects for delete
  using (bucket_id = 'checkin-photos');
