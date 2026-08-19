-- RLS 정책 — 001_schema.sql 실행 후 실행하세요.
-- 기본 거부: 모든 테이블에서 RLS를 켜고, 필요한 정책만 명시적으로 추가한다.

alter table auth_accounts enable row level security;
alter table teachers enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table timetable_items enable row level security;
alter table checkins enable row level security;
alter table emergency_contacts enable row level security;

-- 현재 로그인한 사용자가 교사인지 판별 (auth_accounts/teachers를 SECURITY DEFINER로 조회해
-- RLS 순환 참조 없이 안전하게 확인한다).
create or replace function is_teacher() returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from auth_accounts aa
    join teachers t on t.auth_account_id = aa.id
    where aa.internal_code = split_part(auth.jwt()->>'email', '@', 1)
      and aa.role = 'teacher'
  );
$$;

-- 교사: 전체 읽기 + 관리 데이터 전체 쓰기
create policy teacher_read_groups on groups for select using (is_teacher());
create policy teacher_write_groups on groups for insert with check (is_teacher());
create policy teacher_update_groups on groups for update using (is_teacher());
create policy teacher_all_timetable on timetable_items for all using (is_teacher()) with check (is_teacher());
create policy teacher_all_members on group_members for all using (is_teacher()) with check (is_teacher());
create policy teacher_all_emergency_write on emergency_contacts for all using (is_teacher()) with check (is_teacher());
create policy teacher_all_teachers on teachers for all using (is_teacher()) with check (is_teacher());
create policy teacher_all_accounts on auth_accounts for all using (is_teacher()) with check (is_teacher());
create policy teacher_read_checkins on checkins for select using (is_teacher());

-- 비상연락망은 학생도 봐야 하므로 전체 공개 읽기 (교사는 위 all 정책으로 쓰기까지 가능)
create policy public_read_emergency on emergency_contacts for select using (true);

-- 모둠장(로그인 상태): 자기 모둠만 직접 조회 가능
-- (익명 학생 경로인 get_group_bundle()과는 별개 — 로그인 세션을 실제로 활용하기 위해 유지)
create policy leader_read_own_group on groups for select using (
  auth_account_id is not null and exists (
    select 1 from auth_accounts aa where aa.id = groups.auth_account_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1)));

create policy leader_read_own_timetable on timetable_items for select using (
  exists (select 1 from groups g join auth_accounts aa on aa.id = g.auth_account_id
    where g.id = timetable_items.group_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1)));

create policy leader_read_own_members on group_members for select using (
  exists (select 1 from groups g join auth_accounts aa on aa.id = g.auth_account_id
    where g.id = group_members.group_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1)));

-- checkins: anon/leader용 직접 INSERT 정책 없음 — 쓰기는 오직 submit_checkin()을 통해서만.
-- 학생(anon)은 groups/timetable_items/checkins/group_members에 직접 SELECT 정책이 없음
-- — 읽기는 오직 get_group_bundle()을 통해서만 (해당 함수는 SECURITY DEFINER라 RLS를 우회하되,
--   함수 본문에서 접속코드로 모둠을 직접 검증하므로 다른 모둠 데이터가 새어나갈 수 없다).

-- Storage: 체크인 사진은 공개 읽기, anon 업로드 허용(사진 자체는 민감도가 낮고,
-- 매칭 안 된 잉여 업로드는 용량 낭비일 뿐 보안 문제가 아니라는 판단), 수정/삭제는 막는다.
create policy public_read_checkin_photos on storage.objects for select
  using (bucket_id = 'checkin-photos');
create policy anon_upload_checkin_photos on storage.objects for insert
  with check (bucket_id = 'checkin-photos');
