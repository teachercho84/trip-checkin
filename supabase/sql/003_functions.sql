-- SECURITY DEFINER 함수 (익명 학생 접근용) + 교사용 업로드 RPC
-- 002_rls.sql 실행 후에 실행하세요 (is_teacher() 등을 참조하지는 않지만, 논리적 순서상 나중).

-- ── 로그인 ────────────────────────────────────────────────────────────
-- 로그인 폼의 한글 이름/모둠명 -> 내부 이메일 조회 (로그인 전이므로 anon 실행 가능해야 함)
create or replace function resolve_login_email(p_display_name text, p_role text)
returns text
language sql security definer stable
as $$
  select internal_code || '@internal.local'
  from auth_accounts
  where display_name = p_display_name and role = p_role
  limit 1;
$$;
grant execute on function resolve_login_email(text, text) to anon;

-- ── 학생(익명) 읽기/쓰기 ──────────────────────────────────────────────
-- 접속코드로 자기 모둠 데이터 번들 조회 (다른 모둠 데이터는 절대 포함 안 됨).
-- leader_phone은 의도적으로 응답에서 제외 (학생 화면 개인정보 노출 금지).
create or replace function get_group_bundle(p_access_code text)
returns json
language plpgsql security definer stable
as $$
declare v_group_id uuid;
begin
  select id into v_group_id from groups where access_code = p_access_code;
  if v_group_id is null then
    raise exception 'invalid access code';
  end if;
  return json_build_object(
    'group', (select row_to_json(g) from (select id, name, leader_name from groups where id = v_group_id) g),
    'members', (select coalesce(json_agg(m), '[]'::json) from (select name from group_members where group_id = v_group_id) m),
    'timetable', (select coalesce(json_agg(t order by seq), '[]'::json) from
        (select id, seq, time_planned, place_name, task, lat, lng from timetable_items where group_id = v_group_id) t),
    'checkins', (select coalesce(json_agg(c), '[]'::json) from (select timetable_item_id, checked_in_at, lat, lng, photo_path
        from checkins where group_id = v_group_id) c),
    'emergency_contacts', (select coalesce(json_agg(e order by category, sort_order), '[]'::json) from
        (select category, label, name, phone from emergency_contacts) e)
  );
end;
$$;
grant execute on function get_group_bundle(text) to anon;

-- 전체 모둠 목록 조회 (학부모 공용 링크 -> 모둠 선택 화면용).
-- leader_phone은 여기서도 제외. access_code는 포함 -- 목록에서 모둠을 고르면
-- 그 access_code로 기존 /p/:accessCode(get_group_bundle) 화면으로 이동한다.
create or replace function get_all_groups_summary()
returns json
language sql security definer stable
as $$
  select coalesce(json_agg(g order by name), '[]'::json)
  from (select id, name, leader_name, access_code from groups) g;
$$;
grant execute on function get_all_groups_summary() to anon;

-- 접속코드로 체크인 쓰기 (해당 모둠 소유 항목인지 검증 후 삽입)
create or replace function submit_checkin(
  p_access_code text, p_timetable_item_id uuid,
  p_lat double precision, p_lng double precision, p_photo_path text
) returns uuid
language plpgsql security definer
as $$
declare v_group_id uuid; v_item_group_id uuid; v_checkin_id uuid;
begin
  select id into v_group_id from groups where access_code = p_access_code;
  if v_group_id is null then
    raise exception 'invalid access code';
  end if;

  select group_id into v_item_group_id from timetable_items where id = p_timetable_item_id;
  if v_item_group_id is distinct from v_group_id then
    raise exception 'timetable item does not belong to this group';
  end if;

  insert into checkins (group_id, timetable_item_id, lat, lng, photo_path)
  values (v_group_id, p_timetable_item_id, p_lat, p_lng, p_photo_path)
  returning id into v_checkin_id;
  return v_checkin_id;
end;
$$;
grant execute on function submit_checkin(text, uuid, double precision, double precision, text) to anon;

-- ── 교사용 Excel 업로드 ───────────────────────────────────────────────
-- security invoker(기본값) — 호출자(로그인한 교사)의 RLS 권한에 그대로 의존한다.

create sequence if not exists group_code_seq start 1;
create sequence if not exists teacher_code_seq start 1;

create or replace function next_internal_code(p_role text)
returns text
language plpgsql
as $$
begin
  if p_role = 'teacher' then
    return 't' || lpad(nextval('teacher_code_seq')::text, 3, '0');
  else
    return 'g' || lpad(nextval('group_code_seq')::text, 3, '0');
  end if;
end;
$$;

create or replace function generate_access_code()
returns text
language sql
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- 모둠 1개 분량의 Excel 업로드 처리: 모둠 upsert + 모둠원/타임테이블 전체 교체.
-- p_members: [{"name": "김민준"}, ...]
-- p_timetable: [{"seq":1,"time":"10:00","place":"국제시장","task":"...","lat":35.1,"lng":129.0,"geocode_status":"ok"}, ...]
-- 반환: {"group_id":..., "is_new":true, "internal_code":"g003"} (신규 모둠일 때만 internal_code 포함,
-- 클라이언트가 이 값으로 Edge Function을 호출해 실제 로그인 계정을 만든다)
create or replace function replace_group_timetable(
  p_name text, p_leader_name text, p_leader_student_id text, p_leader_phone text,
  p_members json, p_timetable json
) returns json
language plpgsql
as $$
declare
  v_group_id uuid;
  v_is_new boolean := false;
  v_internal_code text;
  v_auth_account_id uuid;
begin
  select id into v_group_id from groups where name = p_name;

  if v_group_id is null then
    v_is_new := true;
    insert into groups (name, access_code, leader_name, leader_student_id, leader_phone)
    values (p_name, generate_access_code(), p_leader_name, p_leader_student_id, p_leader_phone)
    returning id into v_group_id;

    v_internal_code := next_internal_code('group_leader');
    insert into auth_accounts (internal_code, display_name, role, group_id)
    values (v_internal_code, p_name, 'group_leader', v_group_id)
    returning id into v_auth_account_id;

    update groups set auth_account_id = v_auth_account_id where id = v_group_id;
  else
    update groups
    set leader_name = p_leader_name,
        leader_student_id = p_leader_student_id,
        leader_phone = p_leader_phone,
        updated_at = now()
    where id = v_group_id;
  end if;

  delete from group_members where group_id = v_group_id;
  insert into group_members (group_id, name)
  select v_group_id, (m->>'name')
  from json_array_elements(p_members) m;

  delete from timetable_items where group_id = v_group_id;
  insert into timetable_items (group_id, seq, time_planned, place_name, task, lat, lng, geocode_status)
  select
    v_group_id,
    (t->>'seq')::int,
    (t->>'time')::time,
    (t->>'place'),
    (t->>'task'),
    nullif(t->>'lat', '')::double precision,
    nullif(t->>'lng', '')::double precision,
    coalesce(t->>'geocode_status', 'pending')
  from json_array_elements(p_timetable) t;

  return json_build_object(
    'group_id', v_group_id,
    'is_new', v_is_new,
    'internal_code', case when v_is_new then v_internal_code else null end,
    'display_name', p_name
  );
end;
$$;

-- 설정 탭 "교사 계정 추가" 폼에서 호출. auth_accounts/teachers 행만 만들고,
-- 실제 Supabase Auth 로그인 계정 생성은 이어서 클라이언트가 Edge Function을 호출해 처리한다.
-- 주의: 최초 교사 1명은 is_teacher()를 통과할 기존 교사가 없어 이 경로로 만들 수 없다
-- (M1에서 Supabase 대시보드로 수동 부트스트랩).
create or replace function create_teacher_account(p_name text, p_phone text)
returns json
language plpgsql
as $$
declare v_internal_code text; v_account_id uuid;
begin
  v_internal_code := next_internal_code('teacher');
  insert into auth_accounts (internal_code, display_name, role)
  values (v_internal_code, p_name, 'teacher')
  returning id into v_account_id;

  insert into teachers (auth_account_id, name, phone)
  values (v_account_id, p_name, p_phone);

  return json_build_object('internal_code', v_internal_code, 'display_name', p_name);
end;
$$;
