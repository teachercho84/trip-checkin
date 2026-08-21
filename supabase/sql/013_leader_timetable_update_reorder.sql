-- 일정 항목 "수정" 시에도 시간이 바뀌면 목록 순서(seq)가 자동으로 재정렬되게 한다.
-- 012에서 추가한 insert_timetable_item()은 새 항목만 시간순으로 끼워넣었고,
-- 기존 항목 수정(TimetableItemEditForm.jsx의 edit 경로)은 여전히 time_planned만
-- 직접 업데이트할 뿐 seq는 그대로였다 — 시간을 바꿔도 목록 위치가 안 바뀌던 버그.
-- 012에서 이미 unique(group_id, seq)를 deferrable로 바꿔놨으므로 여기서는 그대로 재사용한다.
-- 001~012 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

create or replace function update_timetable_item(
  p_item_id uuid, p_time_planned time, p_place_name text, p_task text,
  p_lat double precision, p_lng double precision, p_geocode_status text,
  p_update_geocode boolean
) returns void
language plpgsql
as $$
declare
  v_group_id uuid; v_old_seq int; v_old_time time; v_new_seq int;
begin
  select group_id, seq, time_planned into v_group_id, v_old_seq, v_old_time
  from timetable_items where id = p_item_id;

  if v_group_id is null then
    raise exception 'timetable item not found';
  end if;

  set constraints timetable_items_group_id_seq_key deferred;

  if p_time_planned = v_old_time then
    v_new_seq := v_old_seq;
  else
    select count(*) + 1 into v_new_seq
    from timetable_items
    where group_id = v_group_id and id <> p_item_id and time_planned <= p_time_planned;

    if v_new_seq > v_old_seq then
      update timetable_items set seq = seq - 1
      where group_id = v_group_id and seq > v_old_seq and seq <= v_new_seq;
    elsif v_new_seq < v_old_seq then
      update timetable_items set seq = seq + 1
      where group_id = v_group_id and seq >= v_new_seq and seq < v_old_seq;
    end if;
  end if;

  if p_update_geocode then
    update timetable_items
    set seq = v_new_seq, time_planned = p_time_planned, place_name = p_place_name, task = p_task,
        lat = p_lat, lng = p_lng, geocode_status = p_geocode_status
    where id = p_item_id;
  else
    update timetable_items
    set seq = v_new_seq, time_planned = p_time_planned, place_name = p_place_name, task = p_task
    where id = p_item_id;
  end if;
end;
$$;
