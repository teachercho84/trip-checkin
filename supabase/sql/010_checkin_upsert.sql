-- 학생이 이미 체크인한 항목을 "다시 체크인"해서 사진/시각을 갱신할 수 있게 한다.
-- 기존 submit_checkin()은 단순 INSERT라 같은 timetable_item_id로 두 번째 호출하면
-- checkins.unique(timetable_item_id) 제약에 걸려 에러가 났다. ON CONFLICT DO UPDATE로 바꿔
-- 같은 항목에 대한 재호출을 "덮어쓰기"로 처리한다. unique 제약 자체는 유지 (항목당 행 1개).
-- 001~009 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

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
  on conflict (timetable_item_id) do update
    set checked_in_at = now(),
        lat = excluded.lat,
        lng = excluded.lng,
        photo_path = excluded.photo_path
  returning id into v_checkin_id;
  return v_checkin_id;
end;
$$;
grant execute on function submit_checkin(text, uuid, double precision, double precision, text) to anon;
