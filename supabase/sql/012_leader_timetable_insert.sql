-- 모둠장(로그인한 group_leader)이 자기 모둠에 새 일정 항목을 추가할 수 있도록 허용.
-- 005_leader_timetable_edit.sql은 수정/삭제만 허용하고 추가(insert)는 의도적으로 막았었는데,
-- 이번에 "입력한 시간 기준 자동 정렬" 추가 기능을 위해 insert 정책 + 전용 RPC를 추가한다.
--
-- timetable_items에는 unique(group_id, seq) 제약이 있고 deferrable이 아니라서,
-- 중간에 새 항목을 끼워넣으려고 뒤쪽 항목들의 seq를 한 칸씩 미는 UPDATE를 하면
-- 문장 안에서 순간적으로 seq가 겹쳐 에러가 날 수 있다. 제약을 deferrable로 바꾸고
-- 함수 안에서 지연 검증으로 전환해 "밀기 + 삽입"을 한 트랜잭션 끝에서만 검사하게 한다.
--
-- 001~011 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

alter table timetable_items
  drop constraint timetable_items_group_id_seq_key;
alter table timetable_items
  add constraint timetable_items_group_id_seq_key unique (group_id, seq) deferrable initially immediate;

create policy leader_insert_own_timetable on timetable_items for insert with check (
  exists (select 1 from groups g join auth_accounts aa on aa.id = g.auth_account_id
    where g.id = timetable_items.group_id
    and aa.internal_code = split_part(auth.jwt()->>'email', '@', 1))
);

-- security invoker(기본값) — 호출자(로그인한 조장 또는 교사)의 RLS 권한에 그대로 의존한다.
-- 새 항목의 seq는 "같은 모둠에서 입력한 시간보다 같거나 이른 기존 항목 수 + 1"로 계산해
-- 시간순으로 자동 정렬되는 위치에 끼워넣는다.
create or replace function insert_timetable_item(
  p_group_id uuid, p_time_planned time, p_place_name text, p_task text,
  p_lat double precision, p_lng double precision, p_geocode_status text
) returns uuid
language plpgsql
as $$
declare v_new_seq int; v_new_id uuid;
begin
  set constraints timetable_items_group_id_seq_key deferred;

  select count(*) + 1 into v_new_seq
  from timetable_items
  where group_id = p_group_id and time_planned <= p_time_planned;

  update timetable_items
  set seq = seq + 1
  where group_id = p_group_id and seq >= v_new_seq;

  insert into timetable_items (group_id, seq, time_planned, place_name, task, lat, lng, geocode_status)
  values (p_group_id, v_new_seq, p_time_planned, p_place_name, p_task, p_lat, p_lng, coalesce(p_geocode_status, 'pending'))
  returning id into v_new_id;

  return v_new_id;
end;
$$;
