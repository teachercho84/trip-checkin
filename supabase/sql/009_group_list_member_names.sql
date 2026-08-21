-- 우리 아이 모둠 찾기 화면(get_all_groups_summary)에 모둠장 이름만 나와 부모가 자기
-- 아이 모둠을 찾기 어렵다는 피드백 -> 모둠원 이름 목록도 함께 내려주도록 수정한다.
-- 001~008 실행 후, Supabase SQL 에디터에서 이 파일을 실행하세요.

create or replace function get_all_groups_summary()
returns json
language sql security definer stable
as $$
  select coalesce(json_agg(g order by name), '[]'::json)
  from (
    select
      groups.id, groups.name, groups.leader_name, groups.access_code,
      (select coalesce(json_agg(gm.name order by gm.name), '[]'::json)
       from group_members gm where gm.group_id = groups.id) as member_names
    from groups
  ) g;
$$;
grant execute on function get_all_groups_summary() to anon;
