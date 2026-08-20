-- 모둠장(로그인한 group_leader)이 자기 모둠의 일정 항목을 직접 수정/삭제할 수 있도록 허용.
-- 002_rls.sql의 leader_read_own_timetable(읽기 전용)에 이어 쓰기 정책을 추가한다.
-- 새 항목 추가(insert)는 허용하지 않음 — 교사의 엑셀 재업로드로만 가능(의도적 범위 제한).
-- 001~004 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

create policy leader_update_own_timetable on timetable_items for update using (
  exists (select 1 from groups g join auth_accounts aa on aa.id = g.auth_account_id
    where g.id = timetable_items.group_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1))
) with check (
  exists (select 1 from groups g join auth_accounts aa on aa.id = g.auth_account_id
    where g.id = timetable_items.group_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1))
);

create policy leader_delete_own_timetable on timetable_items for delete using (
  exists (select 1 from groups g join auth_accounts aa on aa.id = g.auth_account_id
    where g.id = timetable_items.group_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1))
);
