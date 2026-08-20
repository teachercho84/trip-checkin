-- get_group_bundle()의 emergency_contacts 서브쿼리가 sort_order 컬럼을 select 목록에서
-- 뺀 채로 "order by category, sort_order"를 시도해 매번 'column "sort_order" does not
-- exist' 에러로 실패하고 있었다 (003_functions.sql의 원래 버그 — 지금까지 이 함수를 실제로
-- 호출해본 적이 없어서 발견되지 않았다). sort_order를 select 목록에 포함시켜 수정한다.
-- 001~007 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

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
        (select category, label, name, phone, sort_order from emergency_contacts) e)
  );
end;
$$;
