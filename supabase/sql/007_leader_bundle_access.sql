-- get_group_bundle / submit_checkin는 003_functions.sql에서 anon(비로그인 학생)에게만
-- execute 권한이 부여되어 있었다. ScheduleTab/RouteTab/ContactsTab은 access_code 기반의
-- 이 두 함수를 모둠장(로그인 상태, authenticated 역할)과도 공유하므로, 로그인한 모둠장이
-- 호출하면 "권한 없음"으로 실패했다 (일정/경로/연락처 전부 "불러오지 못했습니다").
-- 001~006 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

grant execute on function get_group_bundle(text) to authenticated;
grant execute on function submit_checkin(text, uuid, double precision, double precision, text) to authenticated;
