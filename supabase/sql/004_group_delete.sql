-- 002_rls.sql에는 groups 테이블에 대한 delete 정책이 없었음 — 교사용 "모둠 삭제" 기능을
-- 추가하며 보완. group_members/timetable_items/checkins/auth_accounts는 이미 group_id에
-- on delete cascade가 걸려 있어(001_schema.sql) groups 행 삭제만으로 함께 정리된다.
-- 001~003 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

create policy teacher_delete_groups on groups for delete using (is_teacher());
