-- checkin-photos 버킷 정책을 다시(안전하게) 보장한다.
--
-- *** 절대 지우면 안 되는 정책: public_read_checkin_photos (SELECT) ***
-- 2026-08-25에 Supabase Security Advisor가 이 정책을 "불필요하게 넓은 권한(누구나 버킷 파일
-- 목록/조회 가능)"이라고 경고했고, "앱은 getPublicUrl()만 쓰고 list()는 안 쓰니 안전하게
-- 지워도 된다"고 판단해 대시보드에서 직접 삭제했다. 그런데 이 판단이 틀렸다 — checkin.js는
-- 사진 업로드 시 항상 upsert:true를 쓰는데(재체크인 지원 때문), PostgreSQL은
-- "INSERT ... ON CONFLICT DO UPDATE"(upsert가 내부적으로 이렇게 처리됨) 실행 시 충돌 여부를
-- 확인하기 위해 대상 테이블에 SELECT 권한(=SELECT RLS 정책 통과)을 항상 요구한다 — 실제로
-- 충돌이 나든 안 나든 마찬가지다. 이 정책이 없으면 "최초 체크인"까지도
-- "new row violates row-level security policy"로 막힌다(재체크인만의 문제가 아니다).
-- gallery.js는 upsert를 안 써서 이 문제가 없다 — 그래서 8/25 이후에도 갤러리 업로드만
-- 계속 정상 작동했고, 아무도 체크인을 다시 시도해보기 전까지(9/4) 이 버그가 안 보였다.
--
-- 그러니 Advisor가 이 정책을 다시 "불필요하다"고 경고해도 지우지 말 것 — 재체크인/upsert
-- 기능이 이 정책에 의존한다. (버킷 목록 노출이 걱정되면 list() 자체를 막는 다른 방법을
-- 찾아야지, 이 SELECT 정책을 지우면 체크인이 통째로 깨진다.)
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
